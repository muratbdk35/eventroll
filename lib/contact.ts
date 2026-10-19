"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { sendEmail } from "@/lib/email/send";
import { env } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { TOPICS } from "@/lib/contact-topics";

/*
 * The contact form (DECISIONS #65): the second fast way to reach us that the
 * imprint needs next to email. It only ever writes to SUPPORT_EMAIL, with
 * the visitor's address as reply-to; it never emails the address typed in,
 * so it can't be used to send mail to strangers. Turnstile, a per-IP limit
 * and a hidden honeypot field keep bots out.
 */

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().max(200),
  topic: z.enum(TOPICS),
  message: z.string().trim().min(10).max(4000),
  /** Hidden field; people never fill it in. */
  website: z.string().max(0).optional(),
});

type ContactInput = z.input<typeof schema>;

export async function sendContact(
  input: ContactInput,
  token: string | null,
): Promise<
  | { ok: true }
  | { ok: false; error: "invalid" | "captcha" | "rate_limited" | "failed" }
> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const ip = clientIp(await headers());
  if (!(await rateLimit("contact", ip, 5, "1 h"))) {
    return { ok: false, error: "rate_limited" };
  }
  if (!(await verifyTurnstile(token, ip)))
    return { ok: false, error: "captcha" };
  if (!env.SUPPORT_EMAIL) return { ok: false, error: "failed" };

  const { name, email, topic, message } = parsed.data;
  const text = [
    `Konu: ${topic}`,
    `Ad: ${name}`,
    `E-posta: ${email}`,
    "",
    message,
    "",
    "Yanıtla dediğinde cevap doğrudan bu kişiye gider.",
  ].join("\n");
  try {
    await sendEmail({
      to: env.SUPPORT_EMAIL,
      replyTo: email,
      subject: `[İletişim · ${topic}] ${name}`.slice(0, 150),
      text,
      html: `<pre style="font:14px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap">${text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")}</pre>`,
    });
  } catch (e) {
    console.error("[contact] send failed", e);
    return { ok: false, error: "failed" };
  }
  return { ok: true };
}
