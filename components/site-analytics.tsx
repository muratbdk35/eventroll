"use client";

import { Analytics } from "@vercel/analytics/next";

/*
 * Vercel Web Analytics (DECISIONS #83): cookieless page views, referrers and
 * utm_* campaigns. Event links and ids are private, so they are masked before
 * anything is sent, and only utm_* query parameters are kept.
 */
function mask(url: string): string {
  const u = new URL(url);
  u.pathname = u.pathname
    .replace(/\/e\/[^/]+/, "/e/[slug]")
    .replace(/\/dashboard\/events\/[^/]+/, "/dashboard/events/[id]");
  for (const key of [...u.searchParams.keys()]) {
    if (!key.startsWith("utm_")) u.searchParams.delete(key);
  }
  return u.toString();
}

export function SiteAnalytics() {
  return <Analytics beforeSend={(e) => ({ ...e, url: mask(e.url) })} />;
}
