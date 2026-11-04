"use client";

import { track } from "@vercel/analytics";

/*
 * Funnel events for Vercel Analytics (DECISIONS #85), each name + value pair
 * sent once per page load so going back and forth doesn't inflate counts.
 * Nothing about the visitor is sent.
 */
const sent = new Set<string>();

export function trackOnce(
  name: string,
  props?: Record<string, string | number | boolean>,
) {
  const key = `${name}|${JSON.stringify(props ?? {})}`;
  if (sent.has(key)) return;
  sent.add(key);
  track(name, props);
}
