import "server-only";
import { render, toPlainText } from "@react-email/components";
import { and, eq, gt, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { createTranslator } from "next-intl";
import { db, schema } from "@/lib/db";
import { user } from "@/lib/db/auth-schema";
import { env } from "@/lib/env";
import { routing, type Locale } from "@/lib/i18n/routing";
import { DAY, noticeDue, type NoticeKind as Kind } from "@/lib/events/notices";
import { sendEmail } from "./send";
import { NoticeEmail } from "./templates/notice";

/*
 * Emails to the host from the daily job (DECISIONS #54), each at most once
 * per event:
 *   - "album ready" once the event is over and photos came in;
 *   - a reminder 3 days and another 1 day before the photos are deleted.
 * An event that only enters the last three days without the first email gets
 * the "album ready" one (it carries the deletion date) and counts as
 * reminded for day 3. Events without photos get nothing.
 */

const { events } = schema;

type Row = {
  id: string;
  name: string;
  locale: string;
  mediaCount: number;
  expiresAt: Date;
  email: string;
  albumReadyMailAt: Date | null;
  reminder3MailAt: Date | null;
};

function resolveLocale(value: string): Locale {
  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : routing.defaultLocale;
}

async function send(kind: Kind, row: Row) {
  const locale = resolveLocale(row.locale);
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const t = createTranslator({
    locale,
    messages,
    namespace: "Email.notice",
  });
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(row.expiresAt);
  const vars = { name: row.name, count: row.mediaCount, date };
  const appName = env.NEXT_PUBLIC_APP_NAME;
  const url = `${env.NEXT_PUBLIC_APP_URL}/${locale}/dashboard/events/${row.id}?view=photos`;
  const html = await render(
    NoticeEmail({
      locale,
      appName,
      appUrl: env.NEXT_PUBLIC_APP_URL,
      url,
      copy: {
        preview: t(`${kind}.preview`, vars),
        heading: t(`${kind}.heading`, vars),
        body: t(`${kind}.body`, vars),
        note: t(`${kind}.note`, vars),
        button: t(`${kind}.button`),
        footer: t("footer"),
      },
    }),
  );
  await sendEmail({
    to: row.email,
    subject: t(`${kind}.subject`, vars),
    html,
    text: `${toPlainText(html)}\n\n${url}`,
  });
}

async function candidates(now: Date) {
  return db
    .select({
      id: events.id,
      name: events.name,
      locale: events.locale,
      mediaCount: events.mediaCount,
      expiresAt: events.expiresAt,
      endsAt: events.endsAt,
      eventDate: events.eventDate,
      albumReadyMailAt: events.albumReadyMailAt,
      reminder3MailAt: events.reminder3MailAt,
      reminder1MailAt: events.reminder1MailAt,
      email: user.email,
    })
    .from(events)
    .innerJoin(user, eq(user.id, events.ownerId))
    .where(
      and(
        eq(events.status, "active"),
        isNotNull(events.plan),
        isNull(events.purgedAt),
        gt(events.mediaCount, 0),
        gt(events.expiresAt, now),
        // Over: its end time, or the end of the event day without one.
        lte(
          sql`coalesce(${events.endsAt}, (${events.eventDate}::date + 1)::timestamptz)`,
          now,
        ),
      ),
    )
    .limit(200);
}

/**
 * Sends what is due. With `dryRun` nothing is sent or stored; it reports
 * which email each event would get.
 */
export async function sendHostNotices({
  now = new Date(),
  dryRun = false,
}: { now?: Date; dryRun?: boolean } = {}) {
  const report: { id: string; name: string; kind: Kind }[] = [];
  for (const row of await candidates(now)) {
    const kind = noticeDue(row, now);
    if (!kind) continue;
    report.push({ id: row.id, name: row.name, kind });
    if (dryRun) continue;
    try {
      await send(kind, row);
    } catch (e) {
      console.warn(
        `[notices] ${kind} for ${row.id} failed: ${(e as Error).message}`,
      );
      continue;
    }
    const left = row.expiresAt.getTime() - now.getTime();
    await db
      .update(events)
      .set(
        kind === "albumReady"
          ? {
              albumReadyMailAt: now,
              // Already within three days: this email was the reminder too.
              ...(left <= 3 * DAY ? { reminder3MailAt: now } : {}),
            }
          : kind === "reminder3"
            ? { reminder3MailAt: now }
            : { reminder1MailAt: now },
      )
      .where(eq(events.id, row.id));
  }
  return report;
}
