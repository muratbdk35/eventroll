import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { captcha, emailOTP, magicLink } from "better-auth/plugins";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendSignInCodeEmail } from "@/lib/email/sign-in-code";
import { env } from "@/lib/env";
import { turnstileSecret } from "@/lib/turnstile";

const google =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined;

export const auth = betterAuth({
  appName: env.NEXT_PUBLIC_APP_NAME,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  socialProviders: google,
  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  plugins: [
    // Bot protection on owner sign-up/sign-in (the code creates accounts).
    captcha({
      provider: "cloudflare-turnstile",
      secretKey: turnstileSecret() ?? "",
      endpoints: ["/email-otp/send-verification-otp", "/sign-in/magic-link"],
    }),
    // Sign in with a 6-digit code from the email (DECISIONS #47). Stored
    // hashed; 10 minutes, 5 tries, a new code replaces the old one.
    emailOTP({
      otpLength: 6,
      expiresIn: 60 * 10,
      allowedAttempts: 5,
      storeOTP: "hashed",
      sendVerificationOTP: async ({ email, otp, type }, ctx) => {
        if (type !== "sign-in") return;
        await sendSignInCodeEmail({
          email,
          code: otp,
          locale: ctx?.headers?.get("x-locale"),
        });
      },
    }),
    // Kept only so /api/dev-login can mint a session locally; it never sends
    // email (sign-in links were replaced by codes, #47).
    magicLink({
      sendMagicLink: async () => {
        throw new Error("Sign-in links are disabled; use the email code.");
      },
    }),
    nextCookies(), // must stay last
  ],
});

export const googleAuthEnabled = Boolean(google);

/** Current session in Server Components / Route Handlers, or null. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export function isAdmin(email: string | null | undefined): boolean {
  return Boolean(email && env.ADMIN_EMAILS.includes(email.toLowerCase()));
}
