"use client";

import type { PostHog } from "posthog-js";
import { publicEnv } from "@/lib/public-env";

/** Product analytics events (spec §14). */
export type AnalyticsEvent =
  | "landing_view"
  | "signup_started"
  | "signup_completed"
  | "event_created"
  | "qr_downloaded"
  | "template_printed"
  | "guest_visit"
  | "upload_started"
  | "upload_completed"
  | "upload_failed"
  | "gallery_viewed"
  | "checkout_started"
  | "checkout_completed"
  | "zip_downloaded"
  | "report_submitted";

let client: Promise<PostHog | null> | null = null;

// Loaded lazily so PostHog never blocks first paint (guest page budget).
function load(): Promise<PostHog | null> {
  if (!publicEnv.posthogKey || typeof window === "undefined") {
    return Promise.resolve(null);
  }
  client ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(publicEnv.posthogKey!, {
      api_host: publicEnv.posthogHost,
      // Privacy-friendly: no cookies/localStorage until consent (phase 1D), no recordings.
      persistence: "memory",
      disable_session_recording: true,
      autocapture: false,
      capture_pageview: "history_change",
      respect_dnt: true,
    });
    return posthog;
  });
  return client;
}

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
) {
  void load().then((ph) => ph?.capture(event, properties));
}
