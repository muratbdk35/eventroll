import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendMagicLinkEmail } from "@/lib/email/magic-link";
import { env } from "@/lib/env";

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
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url, metadata }) => {
        await sendMagicLinkEmail({ email, url, locale: metadata?.locale });
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
