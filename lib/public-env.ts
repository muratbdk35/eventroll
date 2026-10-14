// Client-safe values. NEXT_PUBLIC_* must be referenced literally so Next can inline them.
export const publicEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "EventRoll",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  posthogHost:
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
  // Outside production, falls back to Cloudflare's always-pass test site key.
  turnstileSiteKey:
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    (process.env.NODE_ENV === "production"
      ? undefined
      : "1x00000000000000000000AA"),
} as const;
