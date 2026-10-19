"use server";

import { eq, sql } from "drizzle-orm";
import { createTranslator } from "next-intl";
import { headers } from "next/headers";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { env } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";

/*
 * The online withdrawal function (§ 356a BGB, in force since 19 June 2026,
 * DECISIONS #71). Anyone can use it without signing in: name, order number
 * and an email address, then "Widerruf bestätigen". We confirm receipt at
 * once by email with the content and the time of receipt, and forward the
 * withdrawal to SUPPORT_EMAIL, which is the record. The confirmation goes to
 * the typed address, so it carries only fixed text plus the short fields,
 * behind Turnstile and a per-IP limit.
 */

const LOCALES = ["de", "en", "tr"] as const;

const schemaIn = z.object({
  name: z.string().trim().min(1).max(100),
  orderNo: z.string().trim().min(1).max(40),
  email: z.email().max(200),
  /** Hidden field; people never fill it in. */
  website: z.string().max(0).optional(),
});

export type WithdrawInput = z.input<typeof schemaIn>;

export type WithdrawResult =
  | { ok: true; receivedAt: string }
  | { ok: false; error: "invalid" | "captcha" | "rate_limited" | "failed" };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The order behind an 8-character order number, if there is exactly one. */
async function findOrder(orderNo: string) {
  const prefix = orderNo.replace(/^#/, "").toLowerCase();
  if (!/^[0-9a-f]{8}$/.test(prefix)) return null;
  const rows = await db
    .select({
      id: schema.orders.id,
      plan: schema.orders.plan,
      amount: schema.orders.amountTotal,
      status: schema.orders.status,
      paidAt: schema.orders.paidAt,
      eventId: schema.orders.eventId,
      eventName: schema.events.name,
      ownerEmail: schema.user.email,
    })
    .from(schema.orders)
    .innerJoin(schema.events, eq(schema.events.id, schema.orders.eventId))
    .innerJoin(schema.user, eq(schema.user.id, schema.orders.ownerId))
    .where(sql`${schema.orders.id}::text like ${`${prefix}%`}`)
    .limit(2);
  return rows.length === 1 ? rows[0] : null;
}

export async function submitWithdrawal(
  input: WithdrawInput,
  token: string | null,
  rawLocale: string,
): Promise<WithdrawResult> {
  const parsed = schemaIn.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const ip = clientIp(await headers());
  if (!(await rateLimit("withdraw", ip, 5, "1 h"))) {
    return { ok: false, error: "rate_limited" };
  }
  if (!(await verifyTurnstile(token, ip)))
    return { ok: false, error: "captcha" };
  if (!env.SUPPORT_EMAIL) return { ok: false, error: "failed" };

  const { name, orderNo, email } = parsed.data;
  const receivedAt = new Date();
  const locale = (LOCALES as readonly string[]).includes(rawLocale)
    ? (rawLocale as (typeof LOCALES)[number])
    : "de";
  const messages = (await import(`../messages/${locale}.json`)).default;
  const t = createTranslator({
    locale,
    messages,
    namespace: "Withdraw.email",
  });
  const when = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "medium",
    timeZone: "Europe/Berlin",
  }).format(receivedAt);
  const appName = env.NEXT_PUBLIC_APP_NAME;

  // To the consumer: acknowledgement of receipt on a durable medium.
  const statement = t("statement", { appName, orderNo });
  const lines = [
    t("intro", { appName }),
    "",
    statement,
    `${t("name")}: ${name}`,
    `${t("orderNo")}: ${orderNo}`,
    `${t("email")}: ${email}`,
    `${t("received")}: ${when}`,
    "",
    t("next"),
    "",
    t("footer", { appName, email: env.SUPPORT_EMAIL }),
  ];
  const text = lines.join("\n");
  const html = `<!doctype html><html lang="${locale}"><body style="margin:0;background:#f4f7fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2630"><div style="max-width:560px;margin:0 auto;padding:28px 20px"><div style="background:#fff;border:1px solid #dbe3ee;border-radius:16px;padding:28px;font-size:15px;line-height:1.55">${lines
    .map((l) => (l ? `<p style="margin:0 0 8px">${esc(l)}</p>` : ""))
    .join("")}</div></div></body></html>`;

  // To us: the record, with the order looked up when the number matches.
  let order: Awaited<ReturnType<typeof findOrder>> = null;
  try {
    order = await findOrder(orderNo);
  } catch (e) {
    console.error("[withdraw] order lookup failed", e);
  }
  const notice = [
    "Bir müşteri sitedeki cayma işleviyle sözleşmeden caydı (§ 356a BGB).",
    "",
    `Alındı: ${receivedAt.toISOString()}`,
    `Ad: ${name}`,
    `Sipariş no: ${orderNo}`,
    `E-posta: ${email}`,
    `Dil: ${locale}`,
    "",
    order
      ? [
          `Sipariş bulundu: ${order.id}`,
          `Etkinlik: ${order.eventName} (${order.eventId})`,
          `Plan: ${order.plan}, tutar: ${((order.amount ?? 0) / 100).toFixed(2)} €, durum: ${order.status}`,
          `Ödeme: ${order.paidAt?.toISOString() ?? "-"}`,
          `Hesap e-postası: ${order.ownerEmail}`,
        ].join("\n")
      : "Bu numarayla tek bir sipariş bulunamadı; müşteriye yanıt verip sor.",
    "",
    "Müşteriye otomatik alındı teyidi gitti. Yapılacaklar: 14 gün içinde Stripe'tan iade et. Hizmet müşterinin isteğiyle başladıysa, verilen hizmetin payı kadar düşülebilir (Widerrufsbelehrung). Emin değilsen tamamını iade et.",
  ].join("\n");

  try {
    // Ours first: once it reaches us, the withdrawal is made.
    await sendEmail({
      to: env.SUPPORT_EMAIL,
      replyTo: email,
      subject: `[Cayma] ${orderNo} · ${name}`.slice(0, 150),
      text: notice,
      html: `<pre style="font:14px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap">${esc(notice)}</pre>`,
    });
    await sendEmail({
      to: email,
      replyTo: env.SUPPORT_EMAIL,
      subject: t("subject", { appName }).slice(0, 150),
      text,
      html,
    });
  } catch (e) {
    console.error("[withdraw] send failed", e);
    return { ok: false, error: "failed" };
  }
  return { ok: true, receivedAt: when };
}
