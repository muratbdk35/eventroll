import "server-only";
import { createTranslator } from "next-intl";
import { env } from "@/lib/env";
import { getLegalDoc, legalText, SELLER } from "@/lib/legal/content";
import type { PlanId } from "@/lib/plans";
import { sendEmail } from "./send";

/*
 * Order confirmation on a durable medium (§ 312f BGB, DECISIONS #68): the
 * order, the buyer's express request to start at once and acknowledgement
 * that the right of withdrawal ends once the service is fully provided, the
 * withdrawal instructions with the model form, and the terms as attachments
 * (German, binding; plus the buyer's language). Sent once, when the order
 * turns paid.
 */

const LOCALES = ["de", "en", "tr"] as const;
type Locale = (typeof LOCALES)[number];

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export async function sendOrderConfirmation(o: {
  to: string;
  locale: string | null | undefined;
  orderId: string;
  eventId: string;
  eventName: string;
  plan: PlanId;
  from: PlanId | null;
  amountCents: number;
  taxCents: number;
  currency: string;
  paidAt: Date;
  consentAt: Date | null;
}) {
  const locale: Locale = (LOCALES as readonly string[]).includes(o.locale ?? "")
    ? (o.locale as Locale)
    : "de";
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const t = createTranslator({ locale, messages, namespace: "Email.order" });
  const tp = createTranslator({
    locale,
    messages,
    namespace: "Landing.pricing",
  });
  const appName = env.NEXT_PUBLIC_APP_NAME;
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const ctx = {
    appName,
    supportEmail: env.SUPPORT_EMAIL ?? "",
    appUrl,
  };
  const money = (cents: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: o.currency,
    }).format(cents / 100);
  const when = (d: Date) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Berlin",
    }).format(d);

  const planName = tp(`plans.${o.plan}.name`);
  const rows: [string, string][] = [
    [t("orderNo"), o.orderId.slice(0, 8).toUpperCase()],
    [t("date"), when(o.paidAt)],
    [t("event"), o.eventName],
    [
      t("plan"),
      o.from
        ? `${planName} (${t("upgrade", { from: tp(`plans.${o.from}.name`) })})`
        : planName,
    ],
    [t("total"), money(o.amountCents)],
    [t("vat"), money(o.taxCents)],
  ];
  const consent = o.consentAt
    ? t("consent", { time: when(o.consentAt) })
    : null;

  // The binding German texts as attachments (durable medium, § 312f BGB),
  // plus the buyer's language when that is not German.
  const FILES: Record<Locale, [string, string]> = {
    de: ["AGB-EventRoll.txt", "Widerrufsbelehrung-EventRoll.txt"],
    en: ["Terms-EventRoll-EN.txt", "Withdrawal-EventRoll-EN.txt"],
    tr: ["Kosullar-EventRoll-TR.txt", "Cayma-EventRoll-TR.txt"],
  };
  const attachments = (locale === "de" ? ["de"] : ["de", locale]).flatMap(
    (l) => {
      const [terms, withdrawal] = FILES[l as Locale];
      return [
        {
          filename: terms,
          content: legalText(getLegalDoc("terms", ctx, l)),
        },
        {
          filename: withdrawal,
          content: legalText(getLegalDoc("withdrawal", ctx, l)),
        },
      ];
    },
  );

  const url = `${appUrl}/${locale}/dashboard/events/${o.eventId}`;
  const seller = `${SELLER.company}, ${SELLER.address}`;
  const footer = t("footer", { appName, email: ctx.supportEmail });

  const text = [
    t("heading"),
    "",
    t("intro"),
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    ...(consent ? [t("consentTitle"), consent, ""] : []),
    url,
    "",
    t("attachments"),
    t("stripeNote"),
    "",
    t("seller", { seller }),
    footer,
  ].join("\n");

  const html = `<!doctype html><html lang="${locale}"><body style="margin:0;background:#f4f7fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2630">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<div style="background:#fff;border:1px solid #dbe3ee;border-radius:16px;padding:28px">
<h1 style="margin:0 0 10px;font-size:22px">${esc(t("heading"))}</h1>
<p style="margin:0 0 18px;line-height:1.5;color:#3d4652">${esc(t("intro"))}</p>
<table style="width:100%;border-collapse:collapse;font-size:14px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#66707c">${esc(k)}</td><td style="padding:6px 0;text-align:right;font-weight:600">${esc(v)}</td></tr>`,
    )
    .join("")}</table>
${consent ? `<h2 style="margin:22px 0 6px;font-size:15px">${esc(t("consentTitle"))}</h2><p style="margin:0;line-height:1.5;font-size:14px">${esc(consent)}</p>` : ""}
<p style="margin:22px 0"><a href="${esc(url)}" style="display:inline-block;background:#457094;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:999px">${esc(t("button"))}</a></p>
<p style="margin:0;font-size:13px;line-height:1.5;color:#66707c">${esc(t("attachments"))}</p>
<p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:#66707c">${esc(t("stripeNote"))}</p>
</div>
<p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#66707c">${esc(t("seller", { seller }))}<br>${esc(footer)}</p>
</div></body></html>`;

  await sendEmail({
    to: o.to,
    subject: t("subject", { plan: planName, event: o.eventName }).slice(0, 150),
    html,
    text,
    replyTo: ctx.supportEmail || undefined,
    attachments,
  });
}
