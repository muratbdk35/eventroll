import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSession, googleAuthEnabled } from "@/lib/auth";
import { devLoginEnabled } from "@/lib/dev";
import { env, isProduction } from "@/lib/env";
import { getOwnedEvent } from "@/lib/events/queries";
import { fulfilSessionId } from "@/lib/payments";
import { redirect } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { planOrder, type PlanId } from "@/lib/plans";
import { CreateFlow } from "./create-flow";
import { type FlowStep, STEPS } from "./flow";
import { ticketColor } from "@/lib/events/ticket";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Create");
  return { title: t("metaTitle"), robots: { index: false } };
}

/**
 * The whole setup in one place (DECISIONS #32): details → plan → account →
 * payment → review & publish. Works signed out until the account step; the
 * draft lives in the browser and is saved after sign-in.
 */
export default async function CreatePage({
  params,
  searchParams,
}: PageProps<"/[locale]/create">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const session = await getSession();
  const rawPlan = one(sp.plan);
  const plan = planOrder.includes(rawPlan as PlanId)
    ? (rawPlan as PlanId)
    : null;
  const rawStep = one(sp.step);
  let step: FlowStep = STEPS.includes(rawStep as FlowStep)
    ? (rawStep as FlowStep)
    : "details";

  // Back from Stripe: confirm the payment with Stripe before the review
  // step reads the event (the webhook may not have arrived yet).
  const paidSession = one(sp.session_id);
  if (paidSession && session) {
    await fulfilSessionId(paidSession, session.user.id).catch((e) =>
      console.error("[checkout] return verification failed", e),
    );
    const ev = one(sp.event);
    return redirect({
      href: ev ? `/create?step=review&event=${ev}` : "/dashboard",
      locale,
    });
  }

  const eventId = one(sp.event);
  const event =
    eventId && session ? await getOwnedEvent(eventId, session.user.id) : null;
  if (event && event.status !== "draft") {
    return redirect({ href: `/dashboard/events/${event.id}`, locale });
  }

  // Keep the URL honest: no payment before there is an account, nothing to
  // pay twice. Signed-in hosts still see the account step (who they are).
  if ((step === "pay" || step === "review") && !session) step = "account";
  if (event?.plan && step !== "review") step = "review";
  if (step === "review" && !event?.plan) step = event ? "pay" : "details";

  return (
    <div className="app-ui relative flex min-h-dvh flex-1 flex-col bg-[oklch(0.975_0.012_244)]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-64 -left-56 size-[48rem] rounded-full bg-[radial-gradient(closest-side,oklch(0.57_0.075_240/0.13),transparent)]" />
        <div className="absolute -right-64 -bottom-72 size-[52rem] rounded-full bg-[radial-gradient(closest-side,oklch(0.86_0.055_244/0.4),transparent)]" />
      </div>
      <main className="relative flex flex-1 justify-center px-4 py-8 sm:py-12">
        <CreateFlow
          step={step}
          plan={plan ?? event?.plan ?? null}
          signedIn={Boolean(session)}
          userEmail={session?.user.email ?? null}
          googleEnabled={googleAuthEnabled}
          devLogin={devLoginEnabled}
          devPay={!isProduction && !env.STRIPE_SECRET_KEY}
          event={
            event
              ? {
                  id: event.id,
                  name: event.name,
                  type: event.type,
                  startsAt: event.startsAt?.toISOString() ?? null,
                  endsAt: event.endsAt?.toISOString() ?? null,
                  requireName: event.requireName,
                  hasPin: Boolean(event.accessPinHash),
                  maxUploadsPerDevice: event.maxUploadsPerDevice,
                  plan: event.plan,
                  ticketColor: ticketColor(event.ticketColor),
                }
              : null
          }
        />
      </main>
    </div>
  );
}
