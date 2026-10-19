import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const dev = process.env.NODE_ENV === "development";
// Vercel's comment toolbar is injected on preview deployments only.
const preview = process.env.VERCEL_ENV === "preview";
const vercelLive = preview ? " https://vercel.live" : "";

/*
 * Security headers (DECISIONS #60). The CSP lists every origin the app talks
 * to: R2 for signed photo links and direct uploads, Turnstile, and the
 * optional Sentry and PostHog. Inline scripts stay allowed because Next.js
 * inlines its own bootstrap; a nonce would make every page dynamic.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://eu-assets.i.posthog.com${vercelLive}`,
  `style-src 'self' 'unsafe-inline'${vercelLive}`,
  `img-src 'self' data: blob: https://*.r2.cloudflarestorage.com${vercelLive} https://vercel.com`,
  "media-src 'self' blob: https://*.r2.cloudflarestorage.com",
  `font-src 'self' data:${vercelLive}`,
  `connect-src 'self' data: https://*.r2.cloudflarestorage.com https://challenges.cloudflare.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://eu.i.posthog.com https://eu-assets.i.posthog.com${vercelLive}${preview ? " wss://ws-us3.pusher.com" : ""}${dev ? " ws: wss:" : ""}`,
  `frame-src https://challenges.cloudflare.com${vercelLive}`,
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Event links must not leak to other sites through the Referer header.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // PGlite (dev-only DB) loads WASM/data files at runtime and must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  // TTF fonts for the PNG templates (lib/print/fonts.ts).
  outputFileTracingIncludes: {
    "/api/events/[id]/template": ["./assets/fonts/**"],
    "/[locale]/e/[slug]/opengraph-image": ["./assets/fonts/**"],
  },
  // The landing photos use 60 (lib/images.ts); the default allows only 75.
  images: { qualities: [60, 75] },
  // Cache Components is intentionally off for the MVP (see DECISIONS.md #3).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Source maps are only uploaded when SENTRY_AUTH_TOKEN is set.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
