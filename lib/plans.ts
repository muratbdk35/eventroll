/**
 * Single source of truth for plan prices and limits (spec §8).
 * Server-side enforcement (presign/confirm) reads from here too.
 */
export type PlanId = "free" | "standard" | "premium";

export type PlanLimits = {
  /** One-time price in USD (tax-inclusive, see DECISIONS.md #2). */
  priceUsd: number;
  maxItems: number;
  maxBytes: number;
  allowVideo: boolean;
  maxVideoSeconds: number;
  /** Retention in days after max(paid_at, event_date). */
  retentionDays: number;
  fullZip: boolean;
  allTemplates: boolean;
  customColors: boolean;
  liveSlideshow: boolean;
  guestbook: boolean;
  removeBranding: boolean;
  prioritySupport: boolean;
};

const GB = 1024 ** 3;

export const plans: Record<PlanId, PlanLimits> = {
  free: {
    priceUsd: 0,
    maxItems: 25,
    maxBytes: 1 * GB,
    allowVideo: false,
    maxVideoSeconds: 0,
    retentionDays: 7,
    fullZip: false,
    allTemplates: false,
    customColors: false,
    liveSlideshow: false,
    guestbook: false,
    removeBranding: false,
    prioritySupport: false,
  },
  standard: {
    priceUsd: 29,
    maxItems: 1500,
    maxBytes: 10 * GB,
    allowVideo: true,
    maxVideoSeconds: 120,
    retentionDays: 365,
    fullZip: true,
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
    allowVideo: true,
    maxVideoSeconds: 300,
    retentionDays: 730,
    fullZip: true,
    allTemplates: true,
    customColors: true,
    liveSlideshow: true,
    guestbook: true,
    removeBranding: true,
    prioritySupport: true,
  },
};

export const planOrder: PlanId[] = ["free", "standard", "premium"];

export function getEventLimits(plan: PlanId): PlanLimits {
  return plans[plan];
}
