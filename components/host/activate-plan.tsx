"use client";

import {
  HardDrive,
  Images,
  Loader2,
  Printer,
  QrCode,
  Sparkles,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { BorderBeam } from "@/components/ui/border-beam";
import { devActivate } from "@/lib/events/actions";
import { useRouter } from "@/lib/i18n/navigation";
import { plans, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

const GB = 1024 ** 3;
const names: Record<PlanId, string> = {
  standard: "Standard",
  premium: "Premium",
};

/**
 * Plan cards shown inside the checklist. Premium is the featured card (dark,
 * glow, Magic UI border beam). Until Stripe checkout lands (1C) only the dev
 * activation works.
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
  const [chosen, setChosen] = useState<PlanId | null>(null);

  function choose(plan: PlanId) {
    setChosen(plan);
    start(async () => {
      await devActivate(eventId, plan);
      router.refresh();
    });
  }

  // Premium first, as on the pricing section (DECISIONS #15).
  const order: PlanId[] = ["premium", "standard"];

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {order.map((plan) => {
          const p = plans[plan];
          const featured = plan === "premium";
          const features = [
            {
              Icon: Images,
              text: ta("photos", { count: format.number(p.maxItems) }),
            },
            { Icon: HardDrive, text: ta("storage", { gb: p.maxBytes / GB }) },
            p.printTemplates
              ? { Icon: Printer, text: ta("print") }
              : { Icon: QrCode, text: ta("qr") },
          ];
          return (
            <div
              key={plan}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-3xl p-5 transition-all duration-300 ease-out hover:-translate-y-0.5",
                featured
                  ? "bg-foreground text-background shadow-2xl shadow-primary/25"
                  : "border border-border bg-card shadow-sm hover:shadow-lg",
              )}
            >
              {featured && (
                <>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -top-16 -right-12 size-48 rounded-full bg-primary/45 blur-3xl"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-20 -left-16 size-40 rounded-full bg-[oklch(0.8_0.12_60)]/20 blur-3xl"
                  />
                  <BorderBeam
                    size={90}
                    duration={7}
                    borderWidth={1.5}
                    colorFrom="#fb923c"
                    colorTo="#fde68a"
                  />
                </>
              )}

              <div className="relative flex items-start justify-between gap-2">
                <div>
                  <p className="font-heading text-xl font-semibold">
                    {names[plan]}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-[13px]",
                      featured ? "text-background/65" : "text-muted-foreground",
                    )}
                  >
                    {featured ? ta("taglinePremium") : ta("taglineStandard")}
                  </p>
                </div>
                {featured && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-lg shadow-primary/30">
                    <Sparkles className="size-3" aria-hidden />
                    {ta("best")}
                  </span>
                )}
              </div>

              <p className="relative mt-5 flex items-baseline gap-1.5">
                <span className="font-heading text-[2.6rem] leading-none font-bold tracking-tight">
                  ${p.priceUsd}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    featured ? "text-background/60" : "text-muted-foreground",
                  )}
                >
                  {ta("oneTime")}
                </span>
              </p>

              <ul className="relative mt-5 mb-6 space-y-2.5 text-sm">
                {features.map(({ Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full",
                        featured
                          ? "bg-white/10 text-[oklch(0.82_0.12_55)]"
                          : "bg-accent text-primary",
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={!devMode || pending}
                onClick={() => choose(plan)}
                className={cn(
                  "relative mt-auto flex h-11 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-all duration-300 ease-out active:scale-[0.97] disabled:opacity-60",
                  featured
                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/50"
                    : "border border-input bg-background hover:border-primary/40 hover:bg-accent/40",
                )}
              >
                {pending && chosen === plan && (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                )}
                {ta("choose", { plan: names[plan] })}
              </button>
            </div>
          );
        })}
      </div>
      {devMode && (
        <p className="mt-3 text-xs text-muted-foreground">{ta("devNote")}</p>
      )}
    </div>
  );
}
