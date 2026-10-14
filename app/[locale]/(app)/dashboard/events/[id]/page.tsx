import type { Metadata } from "next";
import { ChevronRight, ExternalLink, Settings } from "lucide-react";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { EventIcon } from "@/components/host/event-icon";
import { LiveShare } from "@/components/host/live-share";
import { BackLink, PageBody } from "@/components/host/page-header";
import { PhotoGrid } from "@/components/host/photo-grid";
import { PrintTemplates } from "@/components/host/print-templates";
import { ResumeSetup } from "@/components/host/resume-setup";
import { SettingsForm } from "@/components/host/settings-form";
import { SharePanel } from "@/components/host/share-panel";
import { StatusPill } from "@/components/host/status-pill";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { env, isProduction } from "@/lib/env";
import {
  getEventStats,
  getOwnedEvent,
  listEventMedia,
} from "@/lib/events/queries";
import { guestUrl } from "@/lib/events/urls";
import { Link, redirect } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { presignGet } from "@/lib/storage";

export const metadata: Metadata = { robots: { index: false } };

type View = "main" | "share" | "settings" | "print";

export default async function EventPage({
  params,
  searchParams,
}: PageProps<"/[locale]/dashboard/events/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  // The layout already redirects signed-out visitors.
  const session = (await getSession())!;

  const event = await getOwnedEvent(id, session.user.id);
  if (!event) return redirect({ href: "/dashboard", locale });

  const sp = await searchParams;
  const raw = sp.view ?? sp.tab;
  const view: View =
    raw === "share" || raw === "settings" || raw === "print" ? raw : "main";

  const [t, format, stats, rows] = await Promise.all([
    getTranslations("Events"),
    getFormatter(),
    getEventStats(event.id),
    view === "main" ? listEventMedia(event.id) : Promise.resolve([]),
  ]);
  const link = guestUrl(event);
  const eventPath = `/dashboard/events/${event.id}`;
  const published = event.status === "active";
  const devMode = !isProduction && !env.STRIPE_SECRET_KEY;
  const date = (d: Date | string) =>
    format.dateTime(typeof d === "string" ? new Date(`${d}T12:00:00Z`) : d, {
      dateStyle: "long",
      timeZone: "UTC",
    });

  const header = (
    <div className="flex items-start gap-4">
      <EventIcon type={event.type} className="size-14" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight text-balance">
            {event.name}
          </h1>
          <StatusPill
            status={event.status}
            label={t(`status.${event.status}`)}
          />
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {[
            date(event.eventDate),
            t("photoCount", { count: stats.photos }),
            t("guestsCount", { count: stats.guests }),
            t("deletesOnShort", { date: date(event.expiresAt) }),
          ].join(" · ")}
        </p>
      </div>
    </div>
  );

  if (view !== "main") {
    return (
      <PageBody>
        {view === "settings" && sp.from === "review" ? (
          <BackLink href={`/create?step=review&event=${event.id}`}>
            {t("backToReview")}
          </BackLink>
        ) : (
          <BackLink
            href={view === "print" ? `${eventPath}?view=share` : eventPath}
          >
            {view === "print" ? t("print.back") : t("backToEvent")}
          </BackLink>
        )}
        {header}
        <div className="mt-8">
          {view === "print" ? (
            published ? (
              <>
                <h2 className="font-heading text-xl font-semibold">
                  {t("print.title")}
                </h2>
                <p className="mt-1 mb-6 text-sm text-muted-foreground">
                  {t("print.subtitle")}
                </p>
                <PrintTemplates
                  eventId={event.id}
                  eventName={event.name}
                  date={date(event.eventDate)}
                  hasPin={Boolean(event.accessPinHash)}
                  pin={event.accessPin}
                  premium={event.plan === "premium"}
                  devMode={devMode}
                />
              </>
            ) : (
              <SharePanel
                eventId={event.id}
                eventName={event.name}
                link={link}
                hasPin={Boolean(event.accessPinHash)}
                published={false}
                premium={event.plan === "premium"}
              />
            )
          ) : view === "share" ? (
            <SharePanel
              eventId={event.id}
              eventName={event.name}
              link={link}
              hasPin={Boolean(event.accessPinHash)}
              published={published}
              premium={event.plan === "premium"}
            />
          ) : (
            <SettingsForm
              eventId={event.id}
              initial={{
                name: event.name,
                requireName: event.requireName,
                eventDate: event.eventDate,
                startsAt: (
                  event.startsAt ?? new Date(`${event.eventDate}T18:00:00Z`)
                ).toISOString(),
                endsAt: (
                  event.endsAt ?? new Date(`${event.eventDate}T23:00:00Z`)
                ).toISOString(),
                hasPin: Boolean(event.accessPinHash),
                uploadOpensAt: event.uploadOpensAt?.toISOString() ?? null,
                uploadClosesAt: event.uploadClosesAt?.toISOString() ?? null,
                maxUploadsPerDevice: event.maxUploadsPerDevice,
              }}
            />
          )}
        </div>
      </PageBody>
    );
  }

  const photos = await Promise.all(
    rows.map(async (m) => ({
      id: m.id,
      src: await presignGet(m.thumbKey ?? m.r2Key),
      full: await presignGet(m.r2Key),
      uploaderName: m.uploaderName,
      width: m.width,
      height: m.height,
      canBlock: Boolean(m.deviceId),
      createdAt: m.createdAt.toISOString(),
    })),
  );

  return (
    <PageBody>
      <BackLink href="/dashboard">{t("back")}</BackLink>
      {header}

      <div className="mt-8">
        {published ? (
          <LiveShare eventId={event.id} link={link} />
        ) : (
          <ResumeSetup eventId={event.id} plan={event.plan} />
        )}
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-semibold">
            {t("photosTitle")}
            {stats.photos > 0 && (
              <span className="ms-2 text-base font-normal text-muted-foreground tabular-nums">
                {stats.photos}
              </span>
            )}
          </h2>
          <Button
            asChild
            variant="ghost"
            className="h-9 rounded-full px-3 text-muted-foreground"
          >
            <a href={link} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden />
              {t("openGuest")}
            </a>
          </Button>
        </div>
        <PhotoGrid eventId={event.id} photos={photos} published={published} />
      </section>

      <Link
        href={`${eventPath}?view=settings`}
        className="group mt-10 flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 sm:p-5"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Settings className="size-5 text-muted-foreground" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t("tabs.settings")}</span>
          <span className="block truncate text-sm text-muted-foreground">
            {t("settings.pinToggle")} · {t("settings.hoursToggle")} ·{" "}
            {t("settings.perPhoneToggle")}
          </span>
        </span>
        <ChevronRight
          className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
          aria-hidden
        />
      </Link>
    </PageBody>
  );
}
