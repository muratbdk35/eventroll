import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/lib/env";
import { applyRefund, expireSession, fulfilSession } from "@/lib/payments";
import { stripe } from "@/lib/stripe";

/**
 * Stripe webhook (DECISIONS #63). Only requests carrying a valid
 * `Stripe-Signature` for our endpoint secret are processed. Handlers are
 * idempotent, so Stripe's retries are harmless; events of other apps on the
 * same Stripe account are ignored (metadata.app).
 */
export async function POST(req: Request) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse(null, { status: 404 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new NextResponse(null, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await req.text(),
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await fulfilSession(event.data.object);
      break;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await expireSession(event.data.object);
      break;
    case "charge.refunded":
      await applyRefund(event.data.object);
      break;
  }
  return NextResponse.json({ received: true });
}
