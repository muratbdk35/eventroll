import "server-only";
import { randomUUID } from "node:crypto";
import { and, count, desc, eq, ne } from "drizzle-orm";
import type Stripe from "stripe";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import {
  computeExpiresAt,
  computeExpiresAtFromEnd,
  CURRENCY,
  isPlanId,
  type PlanId,
} from "@/lib/plans";
import { amountFor, canSelfRefund, planFromOrders } from "@/lib/pricing";
import { sendOrderConfirmation } from "@/lib/email/order-confirmation";
import { SELLER } from "@/lib/legal/content";
import { stripe } from "@/lib/stripe";
import { productId } from "@/lib/stripe-ids";

/*
 * Payments (DECISIONS #63). One Checkout Session per purchase or upgrade;
 * an `orders` row is written before redirecting and marked paid by whichever
 * comes first, the webhook or the host returning to the success page (both
 * verify the session with Stripe). The event's plan is always derived from
 * its paid orders, so refunds made anywhere, in the app or in the Stripe
 * dashboard, put it back to what is still paid for.
 */

const { events, orders } = schema;
type EventRow = typeof events.$inferSelect;

/**
 * The 19% German VAT rate, included in the price (scripts/stripe-setup.mts),
 * looked up once per server instance. Null if it isn't set up.
 */
let vatRate: Promise<string | null> | null = null;
function germanVat(): Promise<string | null> {
  if (!stripe) return Promise.resolve(null);
  vatRate ??= stripe.taxRates
    .list({ active: true, limit: 100 })
    .then(
      (r) =>
        r.data.find(
          (t) =>
            t.metadata?.app === "eventroll" &&
            t.percentage === 19 &&
            t.inclusive,
        )?.id ?? null,
    )
    .catch((e) => {
      vatRate = null; // try again next time
      console.error("[checkout] tax rate lookup failed", e);
      return null;
    });
  return vatRate;
}

/** Under the invoice title, in the buyer's language. */
const PAID_NOTE: Record<string, string> = {
  tr: "Ödendi: sipariş sırasında tahsil edildi, ayrıca ödeme gerekmez",
  de: "Bezahlt: bei der Bestellung beglichen, keine weitere Zahlung nötig",
  en: "Paid: charged at checkout, nothing more to pay",
};

/**
 * Printed at the bottom of every invoice. Our prices stay under € 250, so a
 * Kleinbetragsrechnung (§ 33 UStDV) only needs the seller's name and address;
 * Stripe adds the tax number from the account settings.
 */
const INVOICE_FOOTER = `${SELLER.company}, ${SELLER.address}`;

const CHECKOUT_LOCALES = new Set(["tr", "de", "en"]);

/** Under the pay button on Stripe's page, in the buyer's language. */
const SUBMIT_NOTE: Record<string, string> = {
  tr: "Ödeme onaylanınca etkinliğin hemen açılır; faturan e-postana gelir.",
  de: "Nach der Zahlung ist dein Event sofort freigeschaltet; die Rechnung kommt per E-Mail.",
  en: "Your event unlocks as soon as the payment goes through; the invoice comes by email.",
};

/**
 * Stripe's page in EventRoll's look, for this session only: the company's
 * account-wide branding stays as it is (DECISIONS #75). Images need a public
 * https URL, so local development keeps Stripe's default icon.
 */
function checkoutBranding(
  origin: string,
): Stripe.Checkout.SessionCreateParams.BrandingSettings {
  const images = origin.startsWith("https://")
    ? {
        icon: { type: "url" as const, url: `${origin}/brand/stripe-icon.png` },
        logo: { type: "url" as const, url: `${origin}/brand/stripe-logo.png` },
      }
    : {};
  return {
    display_name: "EventRoll",
    button_color: "#457094",
    background_color: "#f4f7fb",
    border_style: "pill",
    font_family: "inter",
    ...images,
  };
}

export async function createCheckout(opts: {
  event: EventRow;
  plan: PlanId;
  email: string;
  ownerId: string;
  locale: string;
  origin: string;
  successPath: string;
  cancelPath: string;
  /** The withdrawal-waiver box was ticked on our page. */
  consentAt: Date;
}): Promise<
  | { ok: true; url: string }
  | { ok: false; error: "invalid" | "unavailable" | "failed" }
> {
  if (!stripe) return { ok: false, error: "unavailable" };
  const { event, plan } = opts;
  const amount = amountFor(event.plan, plan);
  if (amount === null) return { ok: false, error: "invalid" };

  // VAT: Stripe Tax per country once the company is in OSS, until then the
  // German 19% for everyone (DECISIONS #66).
  const taxRate = env.STRIPE_TAX_ENABLED ? null : await germanVat();
  if (!env.STRIPE_TAX_ENABLED && !taxRate) {
    console.error("[checkout] no 19% tax rate; run npm run stripe:setup");
  }
  const orderId = randomUUID();
  const metadata = {
    app: "eventroll",
    orderId,
    eventId: event.id,
    ownerId: opts.ownerId,
    plan,
    from: event.plan ?? "",
  };
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY.toLowerCase(),
          unit_amount: amount,
          product: productId(plan),
        },
        ...(taxRate ? { tax_rates: [taxRate] } : {}),
      },
    ],
    customer_email: opts.email,
    client_reference_id: event.id,
    metadata,
    payment_intent_data: {
      metadata,
      // Card statements read "<company>* EVENTROLL", so buyers recognise the
      // charge (an unrecognised charge is the usual reason for disputes).
      statement_descriptor_suffix: "EVENTROLL",
      description:
        `EventRoll ${plan}${event.plan ? ` (upgrade from ${event.plan})` : ""}: ${event.name}`.slice(
          0,
          1000,
        ),
    },
    branding_settings: checkoutBranding(opts.origin),
    custom_text: {
      submit: { message: SUBMIT_NOTE[opts.locale] ?? SUBMIT_NOTE.en },
    },
    locale: (CHECKOUT_LOCALES.has(opts.locale) ? opts.locale : "auto") as
      "tr" | "de" | "en" | "auto",
    success_url: `${opts.origin}${opts.successPath}${opts.successPath.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${opts.origin}${opts.cancelPath}`,
    // A Stripe invoice (PDF, emailed) for every purchase (DECISIONS #66).
    invoice_creation: {
      enabled: true,
      invoice_data: {
        // Stripe titles these invoices "amount due"; the line under it
        // makes clear the buyer already paid (DECISIONS #66).
        description:
          `${PAID_NOTE[opts.locale] ?? PAID_NOTE.en} · EventRoll ${plan}: ${event.name}`.slice(
            0,
            1500,
          ),
        metadata,
        // The seller's details, including the tax number (the company has
        // no VAT ID), on every invoice (DECISIONS #66).
        footer: INVOICE_FOOTER,
        rendering_options: { amount_tax_display: "include_inclusive_tax" },
      },
    },
    // Stripe's minimum; an abandoned session expires and frees the order.
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    ...(env.STRIPE_TAX_ENABLED ? { automatic_tax: { enabled: true } } : {}),
  });
  if (!session.url) return { ok: false, error: "failed" };

  await db.insert(orders).values({
    id: orderId,
    eventId: event.id,
    ownerId: opts.ownerId,
    stripeSessionId: session.id,
    plan,
    amountTotal: amount,
    currency: CURRENCY,
    status: "pending",
    withdrawalWaiverAt: opts.consentAt,
  });
  return { ok: true, url: session.url };
}

/** Sets the event's plan (and deletion date) from its paid orders. */
export async function syncPlan(eventId: string) {
  const paid = await db
    .select({ plan: orders.plan })
    .from(orders)
    .where(and(eq(orders.eventId, eventId), eq(orders.status, "paid")));
  const plan = planFromOrders(paid);
  const [event] = await db
    .select({ endsAt: events.endsAt, eventDate: events.eventDate })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!event) return;
  await db
    .update(events)
    .set({
      plan,
      expiresAt: event.endsAt
        ? computeExpiresAtFromEnd(event.endsAt, plan)
        : computeExpiresAt(event.eventDate, plan),
    })
    .where(eq(events.id, eventId));
}

/**
 * Marks the order of a completed, paid session as paid and applies the plan.
 * Idempotent; called from the webhook and from the success page.
 */
export async function fulfilSession(session: Stripe.Checkout.Session) {
  if (session.metadata?.app !== "eventroll") return "ignored" as const;
  if (session.status !== "complete" || session.payment_status !== "paid") {
    return "unpaid" as const;
  }
  const [order] = await db
    .update(orders)
    .set({
      status: "paid",
      paidAt: new Date(),
      amountTotal: session.amount_total,
      currency: session.currency?.toUpperCase() ?? CURRENCY,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
    })
    .where(
      and(eq(orders.stripeSessionId, session.id), eq(orders.status, "pending")),
    )
    .returning({
      id: orders.id,
      eventId: orders.eventId,
      plan: orders.plan,
      paidAt: orders.paidAt,
      withdrawalWaiverAt: orders.withdrawalWaiverAt,
    });
  if (!order) return "already" as const;
  await syncPlan(order.eventId);
  // The confirmation on a durable medium (§ 312f BGB). Only the request
  // that turned the order paid gets here, so it is sent once.
  const to = session.customer_details?.email ?? session.customer_email;
  if (to) {
    const [ev] = await db
      .select({ name: events.name })
      .from(events)
      .where(eq(events.id, order.eventId))
      .limit(1);
    const from = session.metadata?.from;
    await sendOrderConfirmation({
      to,
      locale: session.locale,
      orderId: order.id,
      eventId: order.eventId,
      eventName: ev?.name ?? "",
      plan: order.plan,
      from: from && isPlanId(from) ? from : null,
      amountCents: session.amount_total ?? 0,
      taxCents: session.total_details?.amount_tax ?? 0,
      currency: session.currency?.toUpperCase() ?? CURRENCY,
      paidAt: order.paidAt ?? new Date(),
      consentAt: order.withdrawalWaiverAt,
    }).catch((e) => console.error("[order] confirmation email failed", e));
  }
  return "fulfilled" as const;
}

/** The success page: verify with Stripe instead of trusting the URL. */
export async function fulfilSessionId(sessionId: string, ownerId: string) {
  if (!stripe || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.ownerId !== ownerId) return null;
  return fulfilSession(session);
}

export async function expireSession(session: Stripe.Checkout.Session) {
  await db
    .update(orders)
    .set({ status: "failed" })
    .where(
      and(eq(orders.stripeSessionId, session.id), eq(orders.status, "pending")),
    );
}

/** A charge was refunded (in the app or in Stripe): un-pay the order. */
export async function applyRefund(charge: Stripe.Charge) {
  // Partial refunds keep the plan; only a full refund takes it away.
  if (!charge.refunded) return;
  const pi =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!pi) return;
  const [order] = await db
    .update(orders)
    .set({ status: "refunded" })
    .where(eq(orders.stripePaymentIntentId, pi))
    .returning({ eventId: orders.eventId });
  if (order) await syncPlan(order.eventId);
}

/** Paid orders of an event, newest first (for refunds). */
export async function paidOrders(eventId: string) {
  return db
    .select()
    .from(orders)
    .where(and(eq(orders.eventId, eventId), eq(orders.status, "paid")))
    .orderBy(desc(orders.paidAt));
}

/** Photos ever confirmed for an event, deleted and hidden ones included. */
export async function photosEver(eventId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(schema.media)
    .where(
      and(
        eq(schema.media.eventId, eventId),
        ne(schema.media.status, "pending"),
      ),
    );
  return row?.n ?? 0;
}

/** Whether the host may refund in one click right now (DECISIONS #64). */
export async function selfRefundable(eventId: string) {
  const paid = await paidOrders(eventId);
  if (paid.length === 0) return false;
  const firstPaidAt = paid.reduce<Date | null>(
    (min, o) => (o.paidAt && (!min || o.paidAt < min) ? o.paidAt : min),
    null,
  );
  return canSelfRefund({ firstPaidAt, photosEver: await photosEver(eventId) });
}

/**
 * Refunds every paid order of an event in full and takes the plan away; a
 * published event goes back to draft. The webhook's charge.refunded later
 * finds the orders already refunded and changes nothing.
 */
export async function refundEvent(eventId: string) {
  if (!stripe) return false;
  for (const o of await paidOrders(eventId)) {
    if (!o.stripePaymentIntentId) continue;
    await stripe.refunds.create(
      {
        payment_intent: o.stripePaymentIntentId,
        reason: "requested_by_customer",
        metadata: { app: "eventroll", orderId: o.id, eventId },
      },
      { idempotencyKey: `refund-${o.id}` },
    );
    await db
      .update(orders)
      .set({ status: "refunded" })
      .where(eq(orders.id, o.id));
  }
  await syncPlan(eventId);
  await db
    .update(events)
    .set({ status: "draft" })
    .where(and(eq(events.id, eventId), eq(events.status, "active")));
  return true;
}
