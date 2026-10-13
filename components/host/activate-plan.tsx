"use client";

import { Check, Loader2, LockKeyhole } from "lucide-react";
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

/** Plan picker. Until Stripe checkout lands (1C) only the dev activation works. */
export function ActivatePlan({
  eventId,
  devMode,
}: {
  eventId: string;
  devMode: boolean;
}) {
  const t = useTranslations("Events");
  const ta = useTranslations("Events.activate");
  const format = useFormatter();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<PlanId>("premium");

  // Premium first, as on the pricing section (DECISIONS #15).
  const order = [...planOrder].reverse();

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-background shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700">
          <LockKeyhole className="size-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold">{t("closedTitle")}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("closedBody")}
          </p>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label={t("closedTitle")}
        className="grid gap-3 p-5 sm:grid-cols-2"
      >
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
                "relative rounded-lg border p-4 text-start transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                isSel
                  ? "border-foreground shadow-[inset_0_0_0_1px_var(--foreground)]"
                  : "border-border hover:bg-muted/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full border",
                      isSel
                        ? "border-foreground bg-foreground"
                        : "border-input",
                    )}
                    aria-hidden
                  >
                    {isSel && (
                      <span className="size-1.5 rounded-full bg-background" />
                    )}
                  </span>
                  {names[plan]}
                  {plan === "premium" && (
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-primary">
                      {ta("best")}
                    </span>
                  )}
                </span>
                <span className="text-sm whitespace-nowrap">
                  <span className="font-semibold">${p.priceUsd}</span>{" "}
                  <span className="text-muted-foreground">{ta("oneTime")}</span>
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 ps-6 text-[13px] text-muted-foreground">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check
                      className="size-3.5 shrink-0 text-foreground/70"
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

      <div className="flex flex-col gap-3 border-t border-border bg-muted/30 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {devMode ? ta("devNote") : null}
        </p>
        <Button
          variant="dark"
          className="h-9 px-4"
          disabled={!devMode || pending}
          onClick={() =>
            start(async () => {
              await devActivate(eventId, selected);
              router.refresh();
            })
          }
        >
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {ta("choose", { plan: names[selected] })}
        </Button>
      </div>
    </section>
  );
}
