import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

/**
 * Stripe, when configured (DECISIONS #63). A restricted key is enough:
 * Products and Prices, Checkout Sessions, Charges and Refunds, Webhook
 * Endpoints (write); Payment Intents and Events (read).
 */
export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { appInfo: { name: "EventRoll" } })
  : null;
