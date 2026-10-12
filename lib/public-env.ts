// Client-safe values. NEXT_PUBLIC_* must be referenced literally so Next can inline them.
export const publicEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "EventRoll",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  posthogHost:
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
} as const;
