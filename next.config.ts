import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
  // PGlite (dev-only DB) loads WASM/data files at runtime and must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
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
