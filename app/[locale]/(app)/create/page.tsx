import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSession, googleAuthEnabled } from "@/lib/auth";
import { devLoginEnabled } from "@/lib/dev";
import { env, isProduction } from "@/lib/env";
import { getOwnedEvent } from "@/lib/events/queries";
import { redirect } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { planOrder, type PlanId } from "@/lib/plans";
import { CreateFlow } from "./create-flow";
import { type FlowStep, STEPS } from "./flow";

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
    <div className="app-ui relative flex min-h-dvh flex-1 flex-col bg-[oklch(0.975_0.012_70)]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-48 -left-40 size-[36rem] rounded-full bg-primary/15 blur-[100px]" />
        <div className="absolute -right-48 -bottom-56 size-[40rem] rounded-full bg-[oklch(0.86_0.1_65)]/40 blur-[100px]" />
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
                  uploadOpensAt: event.uploadOpensAt?.toISOString() ?? null,
                  uploadClosesAt: event.uploadClosesAt?.toISOString() ?? null,
                  maxUploadsPerDevice: event.maxUploadsPerDevice,
                  plan: event.plan,
                }
              : null
          }
        />
      </main>
    </div>
  );
}
