/**
 * Single source of truth for plan prices and limits (DECISIONS #15–21, #55).
 * Server-side enforcement (presign/confirm) reads from here too.
 *
 * Photos only, no free plan: an event can be created (QR, settings) without
 * paying, but guests can only upload once a plan is purchased. Four tiers on
 * one slider; every tier has unlimited guests, the explicit-image check and
 * ZIP downloads. No plan shows EventRoll branding to guests.
 */
export type PlanId = "mini" | "standard" | "pro" | "vip";

export type PlanLimits = {
  /** One-time price in whole euros, VAT included (DECISIONS #2, #63). */
  price: number;
  maxItems: number;
  maxBytes: number;
  /** Days after the event during which everything can be downloaded. */
  retentionDays: number;
  /** A rough guide for the slider ("for about 150 guests"); never a limit. */
  guestsHint: number;
  /** Printable QR templates (table cards, tent card, poster). Pro and VIP. */
  printTemplates: boolean;
  /** Longest event: guests upload only between its start and end (#77). */
  maxEventHours: number;
};

const GB = 1024 ** 3;

export const plans: Record<PlanId, PlanLimits> = {
  mini: {
    price: 19,
    maxItems: 1000,
    maxBytes: 10 * GB,
    retentionDays: 7,
    guestsHint: 50,
    printTemplates: false,
    maxEventHours: 24,
  },
  standard: {
    price: 29,
    maxItems: 2500,
    maxBytes: 25 * GB,
    retentionDays: 14,
    guestsHint: 150,
    printTemplates: false,
    maxEventHours: 24,
  },
  pro: {
    price: 39,
    maxItems: 5000,
    maxBytes: 50 * GB,
    retentionDays: 21,
    guestsHint: 300,
    printTemplates: true,
    maxEventHours: 24,
  },
  vip: {
    price: 49,
    maxItems: 7500,
    maxBytes: 75 * GB,
    retentionDays: 30,
    guestsHint: 500,
    printTemplates: true,
    maxEventHours: 48,
  },
};

/** Prices are in euros (DECISIONS #63): most buyers are in the EU, and a
 *  USD price settled in EUR would cost an extra ~2% in Stripe FX fees. */
export const CURRENCY = "EUR";

/**
 * Launch offer (DECISIONS #81): every plan 10 € below its list price. The
 * receipt shows the list price struck through; checkout charges the offer.
 * Set to 0 to end it.
 */
export const LAUNCH_OFF = 10;

/** What a plan costs now, in euros: the list price minus the launch offer. */
export const salePrice = (plan: PlanId) => plans[plan].price - LAUNCH_OFF;

/** Stripe amounts are in cents. */
export const priceCents = (plan: PlanId) => salePrice(plan) * 100;

/** Cheapest first: the slider's order. */
export const planOrder: PlanId[] = ["mini", "standard", "pro", "vip"];

/** Where the slider starts: the tier most events need (DECISIONS #55). */
export const DEFAULT_PLAN: PlanId = "standard";

export function isPlanId(v: unknown): v is PlanId {
  return typeof v === "string" && v in plans;
}

/** The next tier up, for "your album is nearly full" hints. */
export function nextPlan(plan: PlanId): PlanId | null {
  const i = planOrder.indexOf(plan);
  return planOrder[i + 1] ?? null;
}

/**
 * Before a plan is chosen the shortest window applies; once one is, the
 * plan's own (see `computeExpiresAtFromEnd`).
 */
export const MIN_RETENTION_DAYS = plans.mini.retentionDays;

export function retentionDays(plan: PlanId | null | undefined) {
  return plan ? plans[plan].retentionDays : MIN_RETENTION_DAYS;
}

/** Deletion time for an event: end of the (UTC) day of `endsAt + retention`. */
export function computeExpiresAtFromEnd(
  endsAt: Date,
  plan?: PlanId | null,
): Date {
  return computeExpiresAt(endsAt.toISOString().slice(0, 10), plan);
}

/** When an event's media is deleted: end of day `eventDate + retention` (UTC). */
export function computeExpiresAt(
  eventDate: string,
  plan?: PlanId | null,
): Date {
  const d = new Date(`${eventDate}T23:59:59.999Z`);
  d.setUTCDate(d.getUTCDate() + retentionDays(plan));
  return d;
}
