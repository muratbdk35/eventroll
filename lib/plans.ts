/**
 * Single source of truth for plan prices and limits (spec §8, DECISIONS #15–21).
 * Server-side enforcement (presign/confirm) reads from here too.
 *
 * Photos only, no free plan: an event can be created (QR, settings) without
 * paying, but guests can only upload once a plan is purchased. No plan shows
 * EventRoll branding to guests.
 */
export type PlanId = "standard" | "premium";

export type PlanLimits = {
  /** One-time price in USD (tax-inclusive, see DECISIONS.md #2). */
  priceUsd: number;
  maxItems: number;
  maxBytes: number;
  /** Printable QR templates (table cards, signs, posters). Premium only. */
  printTemplates: boolean;
  /** Choosing the guest ticket's colour and pattern (DECISIONS #42). */
  ticketStyles: boolean;
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
    printTemplates: false,
    ticketStyles: false,
  },
  premium: {
    priceUsd: 49,
    maxItems: 5000,
    maxBytes: 50 * GB,
    printTemplates: true,
    ticketStyles: true,
  },
};

export const planOrder: PlanId[] = ["standard", "premium"];

export function getEventLimits(plan: PlanId): PlanLimits {
  return plans[plan];
}

/** Deletion time for events with an end time: end of the (UTC) day of `endsAt + DOWNLOAD_WINDOW_DAYS`. */
export function computeExpiresAtFromEnd(endsAt: Date): Date {
  return computeExpiresAt(endsAt.toISOString().slice(0, 10));
}

/** When an event's media is deleted: end of day `eventDate + DOWNLOAD_WINDOW_DAYS` (UTC). */
export function computeExpiresAt(eventDate: string): Date {
  const d = new Date(`${eventDate}T23:59:59.999Z`);
  d.setUTCDate(d.getUTCDate() + DOWNLOAD_WINDOW_DAYS);
  return d;
}
