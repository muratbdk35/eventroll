/**
 * Creates (or updates) one Stripe product per plan, with fixed ids
 * (`eventroll_mini` …), so checkout can refer to them (DECISIONS #63), and
 * the 19% German VAT rate, included in the price, shown on every invoice
 * (DECISIONS #66).
 * Prices aren't Stripe objects: amounts come from lib/plans.ts at checkout.
 * Safe to run again; run it once per Stripe account / mode.
 *
 *   STRIPE_SECRET_KEY=rk_test_… npx tsx scripts/stripe-setup.mts
 */
import Stripe from "stripe";
import { planOrder } from "../lib/plans.js";
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
  const fields = {
    name: `EventRoll ${names[plan]}`,
    metadata: { app: "eventroll", plan },
  };
  try {
    await stripe.products.retrieve(id);
    // No description: Stripe shows it in one language to every buyer. The
    // plan's details are on our pay step, in the buyer's language, and on the
    // invoice line (DECISIONS #75). "" clears an old one; create rejects it.
    await stripe.products.update(id, { ...fields, description: "" });
    console.log(`updated ${id}`);
  } catch (e) {
    if ((e as { code?: string }).code !== "resource_missing") throw e;
    await stripe.products.create({ id, ...fields });
    console.log(`created ${id}`);
  }
}

// German VAT, included in the price. Tax rates can't be updated or given an
// id, so an existing active one tagged for the app is reused.
const rates = await stripe.taxRates.list({ active: true, limit: 100 });
const existing = rates.data.find(
  (r) => r.metadata?.app === "eventroll" && r.percentage === 19 && r.inclusive,
);
if (existing) {
  console.log(`tax rate ${existing.id} (19% incl.) already there`);
} else {
  const r = await stripe.taxRates.create({
    display_name: "MwSt.",
    description: "Umsatzsteuer 19 % (Deutschland)",
    percentage: 19,
    inclusive: true,
    country: "DE",
    jurisdiction: "DE",
    tax_type: "vat",
    metadata: { app: "eventroll" },
  });
  console.log(`created tax rate ${r.id} (19% incl.)`);
}
