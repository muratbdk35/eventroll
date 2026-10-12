import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/** Sends an email via Resend. Returns the provider message id. */
export async function sendEmail(email: OutgoingEmail): Promise<string | null> {
  if (!resend || !env.EMAIL_FROM) {
    if (env.VERCEL_ENV === "production") {
      throw new Error("Email is not configured (RESEND_API_KEY / EMAIL_FROM).");
    }
    // DEV ONLY: no provider configured, print the email instead of sending it.
    console.info(
      `\n[dev-email] to=${email.to}\n[dev-email] subject=${email.subject}\n${email.text}\n`,
    );
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return data?.id ?? null;
}
