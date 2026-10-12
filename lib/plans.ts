/**
 * Single source of truth for plan prices and limits (spec §8, DECISIONS #15–17).
 * Server-side enforcement (presign/confirm) reads from here too.
 *
 * Photos only, no video (DECISIONS #19). There is no free plan: an event can be created (QR, settings) without paying,
 * but guests can only upload once a plan is purchased.
 */
export type PlanId = "standard" | "premium";

export type PlanLimits = {
  /** One-time price in USD (tax-inclusive, see DECISIONS.md #2). */
  priceUsd: number;
  maxItems: number;
  maxBytes: number;
  allTemplates: boolean;
  customColors: boolean;
  liveSlideshow: boolean;
  guestbook: boolean;
  removeBranding: boolean;
  prioritySupport: boolean;
};

const GB = 1024 ** 3;

/**
 * Everything is kept until `DOWNLOAD_WINDOW_DAYS` after the event date, then
 * permanently deleted. Hosts download the full-quality ZIP in that window.
 */
export const DOWNLOAD_WINDOW_DAYS = 7;

export const plans: Record<PlanId, PlanLimits> = {
  standard: {
    priceUsd: 29,
    maxItems: 1500,
    maxBytes: 10 * GB,
    allTemplates: true,
    customColors: false,
    liveSlideshow: false,
    guestbook: false,
    removeBranding: false,
    prioritySupport: false,
  },
  premium: {
    priceUsd: 49,
    maxItems: 5000,
    maxBytes: 50 * GB,
    allTemplates: true,
    customColors: true,
    liveSlideshow: true,
    guestbook: true,
    removeBranding: true,
    prioritySupport: true,
  },
};

export const planOrder: PlanId[] = ["standard", "premium"];

export function getEventLimits(plan: PlanId): PlanLimits {
  return plans[plan];
}

/** When an event's media is deleted: end of day `eventDate + DOWNLOAD_WINDOW_DAYS` (UTC). */
export function computeExpiresAt(eventDate: string): Date {
  const d = new Date(`${eventDate}T23:59:59.999Z`);
  d.setUTCDate(d.getUTCDate() + DOWNLOAD_WINDOW_DAYS);
  return d;
}
