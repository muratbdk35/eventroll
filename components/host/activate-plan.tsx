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

/** Plan picker. Until Stripe checkout lands (1C) only the dev activation works. */
export function ActivatePlan({
  eventId,
  devMode,
}: {
  eventId: string;
  devMode: boolean;
}) {
  const t = useTranslations("Events.activate");
  const format = useFormatter();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [chosen, setChosen] = useState<PlanId | null>(null);

  // Premium first, as on the pricing section (DECISIONS #15).
  const order = [...planOrder].reverse();

  return (
    <section className="rounded-[2rem] border border-border bg-gradient-to-br from-accent/70 via-card to-card p-6 sm:p-8">
      <div className="max-w-xl">
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          {t("title")}
        </h2>
        <p className="mt-1.5 text-pretty text-muted-foreground">{t("body")}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {order.map((plan) => {
          const p = plans[plan];
          const featured = plan === "premium";
          const features = [
            t("photos", { count: format.number(p.maxItems) }),
            t("storage", { gb: p.maxBytes / GB }),
            t("qr"),
            ...(p.printTemplates ? [t("print")] : []),
          ];
          return (
            <div
              key={plan}
              className={cn(
                "relative flex flex-col rounded-3xl border p-6",
                featured
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card",
              )}
            >
              {featured && (
                <span className="absolute end-5 top-5 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                  {t("best")}
                </span>
              )}
              <p className="font-heading text-lg font-semibold">
                {names[plan]}
              </p>
              <p className="mt-2 flex items-baseline gap-1.5">
                <span className="font-heading text-4xl font-bold tracking-tight">
                  ${p.priceUsd}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    featured ? "text-background/65" : "text-muted-foreground",
                  )}
                >
                  {t("oneTime")}
                </span>
              </p>
              <ul className="mt-5 mb-6 space-y-2.5 text-sm">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        featured ? "text-primary" : "text-success",
                      )}
                      aria-hidden
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className={cn(
                  "mt-auto h-11 rounded-xl",
                  featured
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "",
                )}
                variant={featured ? "default" : "outline"}
                disabled={!devMode || pending}
                onClick={() => {
                  setChosen(plan);
                  start(async () => {
                    await devActivate(eventId, plan);
                    router.refresh();
                  });
                }}
              >
                {pending && chosen === plan && (
                  <Loader2 className="animate-spin" aria-hidden />
                )}
                {t("choose", { plan: names[plan] })}
              </Button>
            </div>
          );
        })}
      </div>
      {devMode && (
        <p className="mt-4 text-xs text-muted-foreground">{t("devNote")}</p>
      )}
    </section>
  );
}
