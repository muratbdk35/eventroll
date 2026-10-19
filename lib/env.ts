import "server-only";
import { z } from "zod";

const optional = z.string().trim().min(1).optional();
const bool = z
  .enum(["true", "false"])
  .default("false")
  .transform((v) => v === "true");

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("EventRoll"),
  DEFAULT_LOCALE: z.enum(["en", "tr", "de"]).default("en"),
  CRON_SECRET: optional,
  ADMIN_EMAILS: z
    .string()
    .default("")
    .transform((s) =>
      s
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  FINGERPRINT_SALT: optional,
  // 32 random bytes, base64: encrypts uploader IPs (lib/guest/ip.ts).
  IP_ENCRYPTION_KEY: optional,

  // Database
  // postgres://… (Neon) or, for local dev/tests only, pglite:<dir> | pglite:memory
  DATABASE_URL: z
    .string()
    .regex(
      /^(postgres(ql)?:\/\/|pglite:)/,
      "must be a postgres:// URL (or pglite: for local dev)",
    ),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(32, "must be at least 32 characters"),
  BETTER_AUTH_URL: z.url(),
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,

  // Storage (Cloudflare R2)
  R2_ACCOUNT_ID: optional,
  R2_ACCESS_KEY_ID: optional,
  R2_SECRET_ACCESS_KEY: optional,
  R2_BUCKET: optional,
  R2_ENDPOINT: z.url().optional(),

  // Bot protection
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optional,
  TURNSTILE_SECRET_KEY: optional,

  // Payments
  STRIPE_SECRET_KEY: optional,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optional,
  STRIPE_WEBHOOK_SECRET: optional,
  STRIPE_PRICE_MINI: optional,
  STRIPE_PRICE_STANDARD: optional,
  STRIPE_PRICE_PRO: optional,
  STRIPE_PRICE_VIP: optional,
  STRIPE_TAX_ENABLED: bool,

  // Email
  RESEND_API_KEY: optional,
  EMAIL_FROM: optional,
  SUPPORT_EMAIL: z.email().optional(),

  // Rate limiting
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: optional,

  // Observability / analytics
  NEXT_PUBLIC_POSTHOG_KEY: optional,
  NEXT_PUBLIC_POSTHOG_HOST: z.url().optional(),
  // Explicit-image check for guest uploads (DECISIONS #52); off without keys.
  SIGHTENGINE_API_USER: optional,
  SIGHTENGINE_API_SECRET: optional,
  SENTRY_DSN: optional,
  NEXT_PUBLIC_SENTRY_DSN: optional,
  SENTRY_AUTH_TOKEN: optional,
  SENTRY_ORG: optional,
  SENTRY_PROJECT: optional,

  // Marketing pixels (consent-gated)
  NEXT_PUBLIC_GADS_ID: optional,
  NEXT_PUBLIC_GADS_PURCHASE_LABEL: optional,
  NEXT_PUBLIC_META_PIXEL_ID: optional,
  NEXT_PUBLIC_GA_ID: optional,
});

/**
 * Optional during local development (mocks/console fallbacks are used),
 * but must be set in the production deployment.
 */
const requiredInProduction = [
  "CRON_SECRET",
  "FINGERPRINT_SALT",
  "IP_ENCRYPTION_KEY",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_ENDPOINT",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_MINI",
  "STRIPE_PRICE_STANDARD",
  "STRIPE_PRICE_PRO",
  "STRIPE_PRICE_VIP",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "SUPPORT_EMAIL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const satisfies readonly (keyof z.infer<typeof schema>)[];

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema
    .superRefine((env, ctx) => {
      if (env.VERCEL_ENV !== "production") return;
      if (env.DATABASE_URL.startsWith("pglite:")) {
        ctx.addIssue({
          code: "custom",
          path: ["DATABASE_URL"],
          message: "pglite is dev-only",
        });
      }
      // QR codes and guest links are built from this: never localhost in prod.
      const appUrl = new URL(env.NEXT_PUBLIC_APP_URL);
      if (
        appUrl.protocol !== "https:" ||
        ["localhost", "127.0.0.1", "[::1]"].includes(appUrl.hostname)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["NEXT_PUBLIC_APP_URL"],
          message: "must be the public https URL in production",
        });
      }
      for (const key of requiredInProduction) {
        if (!env[key]) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: "required in production",
          });
        }
      }
    })
    .safeParse(source);

  if (!result.success) {
    const lines = result.error.issues.map(
      (i) => `  - ${i.path.join(".")}: ${i.message}`,
    );
    throw new Error(
      `Invalid environment variables:\n${lines.join("\n")}\n` +
        "Copy .env.example to .env.local and fill in the missing values.",
    );
  }
  return result.data;
}

export const env = parseEnv(process.env);

export const isProduction = env.VERCEL_ENV === "production";
