import type { PlanId } from "./plans";

/** Fixed Stripe product ids, one per plan (scripts/stripe-setup.mts). */
export const productId = (plan: PlanId) => `eventroll_${plan}`;
