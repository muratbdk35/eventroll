import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
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
