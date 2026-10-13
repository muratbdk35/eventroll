"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { devActivate } from "@/lib/events/actions";
import { useRouter } from "@/lib/i18n/navigation";
import { plans, planOrder } from "@/lib/plans";

/** Placeholder for checkout until Stripe is wired up (phase 1C). */
export function ActivatePlan({
  eventId,
  devMode,
}: {
  eventId: string;
  devMode: boolean;
}) {
  const t = useTranslations("Events.activate");
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <section className="rounded-3xl border border-border bg-accent/50 p-6">
      <h2 className="font-heading text-lg font-semibold">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("body")}</p>
      {devMode && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {planOrder.map((plan) => (
              <Button
                key={plan}
                className="h-10 rounded-xl"
                variant={plan === "premium" ? "default" : "outline"}
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await devActivate(eventId, plan);
                    router.refresh();
                  })
                }
              >
                {t(plan, { price: plans[plan].priceUsd })}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t("devNote")}</p>
        </>
      )}
    </section>
  );
}
