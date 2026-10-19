/**
 * Creates (or updates) one Stripe product per plan, with fixed ids
 * (`eventroll_mini` …), so checkout can refer to them (DECISIONS #63).
 * Prices aren't Stripe objects: amounts come from lib/plans.ts at checkout.
 * Safe to run again; run it once per Stripe account / mode.
 *
 *   STRIPE_SECRET_KEY=rk_test_… npx tsx scripts/stripe-setup.mts
 */
import Stripe from "stripe";
import { planOrder, plans } from "../lib/plans.js";
import { productId } from "../lib/stripe-ids.js";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY.");
  process.exit(1);
}
const stripe = new Stripe(key);
const names = { mini: "Mini", standard: "Standard", pro: "Pro", vip: "VIP" };

for (const plan of planOrder) {
  const id = productId(plan);
  const p = plans[plan];
  const fields = {
    name: `EventRoll ${names[plan]}`,
    description: `${p.maxItems.toLocaleString("en")} photos, ${p.maxBytes / 1024 ** 3} GB, ${p.retentionDays}-day download window`,
    metadata: { app: "eventroll", plan },
  };
  try {
    await stripe.products.retrieve(id);
    await stripe.products.update(id, fields);
    console.log(`updated ${id}`);
  } catch (e) {
    if ((e as { code?: string }).code !== "resource_missing") throw e;
    await stripe.products.create({ id, ...fields });
    console.log(`created ${id}`);
  }
}
