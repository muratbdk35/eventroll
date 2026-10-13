"use client";

import { Check, Loader2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { devActivate } from "@/lib/events/actions";
import { useRouter } from "@/lib/i18n/navigation";
import { planOrder, plans, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

const GB = 1024 ** 3;
const names: Record<PlanId, string> = {
  standard: "Standard",
  premium: "Premium",
};

/**
 * Plan picker shown inside the "next steps" card. Until Stripe checkout lands
 * (1C) only the dev activation works.
 */
export function ActivatePlan({
  eventId,
  devMode,
}: {
  eventId: string;
  devMode: boolean;
}) {
  const ta = useTranslations("Events.activate");
  const format = useFormatter();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<PlanId>("premium");

  // Premium first, as on the pricing section (DECISIONS #15).
  const order = [...planOrder].reverse();

  return (
    <div>
      <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
        {order.map((plan) => {
          const p = plans[plan];
          const isSel = selected === plan;
          const features = [
            ta("photos", { count: format.number(p.maxItems) }),
            ta("storage", { gb: p.maxBytes / GB }),
            ...(p.printTemplates ? [ta("print")] : [ta("qr")]),
          ];
          return (
            <button
              key={plan}
              type="button"
              role="radio"
              aria-checked={isSel}
              onClick={() => setSelected(plan)}
              className={cn(
                "rounded-xl border p-4 text-start transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                isSel
                  ? "border-primary bg-accent/50 shadow-[inset_0_0_0_1px_var(--primary)]"
                  : "border-border bg-background hover:border-primary/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-semibold">
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full border-2",
                      isSel ? "border-primary" : "border-input",
                    )}
                    aria-hidden
                  >
                    {isSel && (
                      <span className="size-1.5 rounded-full bg-primary" />
                    )}
                  </span>
                  {names[plan]}
                  {plan === "premium" && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10.5px] font-semibold text-primary-foreground">
                      {ta("best")}
                    </span>
                  )}
                </span>
                <span className="font-heading text-lg font-bold">
                  ${p.priceUsd}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-[13px] text-muted-foreground">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check
                      className="size-3.5 shrink-0 text-primary"
                      aria-hidden
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {devMode ? ta("devNote") : null}
        </p>
        <Button
          className="h-10 shrink-0 rounded-full px-5"
          disabled={!devMode || pending}
          onClick={() =>
            start(async () => {
              await devActivate(eventId, selected);
              router.refresh();
            })
          }
        >
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {ta("choose", { plan: names[selected] })} · $
          {plans[selected].priceUsd}
        </Button>
      </div>
    </div>
  );
}
