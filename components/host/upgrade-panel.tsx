"use client";

import { Check, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { HaloButton } from "@/components/halo/halo-button";
import { devActivate, startCheckout } from "@/lib/events/actions";
import { Link, useRouter } from "@/lib/i18n/navigation";
import type { PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

export type UpgradeOption = {
  id: PlanId;
  name: string;
  /** What the host pays now: the difference, formatted. */
  price: string;
  details: string;
  templates: boolean;
};

/**
 * A bigger plan for an event that already has one (DECISIONS #64): pick the
 * plan, pay only the difference through Stripe Checkout. Same withdrawal
 * waiver as the first purchase.
 */
export function UpgradePanel({
  eventId,
  options,
  devMode,
}: {
  eventId: string;
  options: UpgradeOption[];
  devMode: boolean;
}) {
  const t = useTranslations("Events.upgrade");
  const tc = useTranslations("Create.pay");
  const router = useRouter();
  const [plan, setPlan] = useState<PlanId>(options[0].id);
  const [consent, setConsent] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();
  const picked = options.find((o) => o.id === plan)!;

  function pay() {
    setFailed(false);
    start(async () => {
      if (devMode) {
        const res = await devActivate(eventId, plan);
        if (res.ok) router.push(`/dashboard/events/${eventId}?upgraded=1`);
        return;
      }
      const res = await startCheckout(eventId, plan, consent, "dashboard");
      if (res.ok) window.location.assign(res.url);
      else setFailed(true);
    });
  }

  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label={t("title")} className="space-y-2.5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={plan === o.id}
            onClick={() => setPlan(o.id)}
            className={cn(
              "flex w-full items-center gap-3.5 rounded-2xl border bg-card p-4 text-start shadow-xs transition-colors",
              plan === o.id
                ? "border-primary ring-1 ring-primary"
                : "border-border hover:border-primary/40",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                plan === o.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40",
              )}
            >
              {plan === o.id && <Check className="size-3" strokeWidth={3.5} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{o.name}</span>
              <span className="mt-0.5 block text-[13px] text-pretty text-muted-foreground">
                {o.details}
                {o.templates && `\u00a0· ${t("templates")}`}
              </span>
            </span>
            <span className="shrink-0 text-end">
              <span className="block font-heading text-lg font-bold">
                +{o.price}
              </span>
            </span>
          </button>
        ))}
      </div>

      {!devMode && (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-3.5 text-[13px] leading-snug text-pretty">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 size-4.5 shrink-0 accent-primary"
          />
          <span>
            {tc.rich("consent", {
              terms: (c) => (
                <Link
                  href="/legal/terms"
                  target="_blank"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  {c}
                </Link>
              ),
              withdrawal: (c) => (
                <Link
                  href="/legal/withdrawal"
                  target="_blank"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  {c}
                </Link>
              ),
            })}
          </span>
        </label>
      )}

      <HaloButton
        size="lg"
        fullWidth
        disabled={!devMode && !consent}
        isLoading={pending}
        leading={<Lock aria-hidden />}
        onClick={pay}
      >
        {t("pay", { plan: picked.name, price: picked.price })}
      </HaloButton>
      <p
        role={failed ? "alert" : undefined}
        className={cn(
          "text-center text-xs text-pretty",
          failed ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {failed ? tc("failed") : t("note")}
      </p>
    </div>
  );
}
