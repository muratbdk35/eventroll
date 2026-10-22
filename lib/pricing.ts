import { planOrder, priceCents, type PlanId } from "./plans";

/* Pure pricing rules for checkout and refunds (DECISIONS #63). */

const rank = (p: PlanId | null) => (p ? planOrder.indexOf(p) : -1);

/**
 * What the host pays to reach `plan`, in cents: the full price, or the
 * difference to the plan already paid for. Null for the same plan or a
 * downgrade.
 */
export function amountFor(current: PlanId | null, plan: PlanId) {
  if (rank(plan) <= rank(current)) return null;
  return priceCents(plan) - (current ? priceCents(current) : 0);
}

/** The highest plan among an event's paid orders, or null. */
export function planFromOrders(paid: { plan: PlanId }[]): PlanId | null {
  return paid.reduce<PlanId | null>(
    (best, o) => (rank(o.plan) > rank(best) ? o.plan : best),
    null,
  );
}

/** Self-service refund window, from the first payment. */
export const REFUND_DAYS = 14;

/**
 * The host can refund in one click while no photo has been uploaded and the
 * first payment is at most REFUND_DAYS old (DECISIONS #64).
 */
export function canSelfRefund(opts: {
  firstPaidAt: Date | null;
  photosEver: number;
  now?: Date;
}) {
  const { firstPaidAt, photosEver, now = new Date() } = opts;
  if (!firstPaidAt || photosEver > 0) return false;
  return now.getTime() - firstPaidAt.getTime() <= REFUND_DAYS * 864e5;
}

/** Stripe's smallest charge in euros; a cheaper discounted plan is free. */
export const MIN_CHARGE_CENTS = 50;

/**
 * The price after a discount code (#79), in cents: rounded to the cent, and
 * free when it would fall under Stripe's minimum charge.
 */
export function discounted(amountCents: number, percentOff: number) {
  const pct = Math.min(100, Math.max(0, Math.round(percentOff)));
  const left = Math.round((amountCents * (100 - pct)) / 100);
  return left < MIN_CHARGE_CENTS ? 0 : left;
}
