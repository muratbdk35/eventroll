"use client";

import { ArrowLeft } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { PlanReceipt } from "@/components/billing/plan-receipt";
import { planReceiptContent } from "@/components/billing/receipt-content";
import { HaloButton } from "@/components/halo/halo-button";
import { DEFAULT_PLAN, planOrder, type PlanId } from "@/lib/plans";
import { publicEnv } from "@/lib/public-env";
import { StepFooter, StepHeading } from "./create-flow";
import { type FlowProps, flowHref } from "./flow";

/**
 * Step 2, the paywall: the very same slider receipt as the landing pricing
 * section (components/billing), on the same blue ground (DECISIONS #32, #55).
 * It opens on the plan picked on the landing page, else on Standard.
 */
export function PlanStep({ plan, event }: FlowProps) {
  const t = useTranslations("Create");
  const tp = useTranslations("Landing.pricing");
  const format = useFormatter();
  const locale = useLocale();
  const upper = (s: string) => s.toLocaleUpperCase(locale);
  const content = planReceiptContent({
    t: tp as never,
    number: format.number as never,
    locale,
    appName: publicEnv.appName,
  });
  const each = <V,>(f: (id: PlanId) => V) =>
    Object.fromEntries(planOrder.map((id) => [id, f(id)])) as Record<PlanId, V>;

  return (
    <div>
      <StepHeading title={t("plan.title")} subtitle={t("plan.subtitle")} />

      {/* Same plain blue table as the landing pricing (DECISIONS #40). */}
      <div className="clip-round relative overflow-hidden rounded-[1.25rem] bg-primary px-5 pt-12 pb-14 sm:px-10">
        <div
          aria-hidden
          className="absolute inset-0 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.12]"
        />

        <div className="receipt-in relative mx-auto max-w-[400px]">
          <PlanReceipt
            {...content}
            initial={plan ?? DEFAULT_PLAN}
            hrefs={each((id) =>
              flowHref("account", { plan: id, event: event?.id }),
            )}
            ctas={each((id) =>
              upper(t("plan.choose", { plan: tp(`plans.${id}.name`) })),
            )}
          />
        </div>
        <p className="relative mx-auto mt-10 max-w-xl text-center text-xs text-white/75">
          {tp("footnote")}
        </p>
      </div>

      <StepFooter
        back={
          !event && (
            <HaloButton
              tone="secondary"
              href={flowHref("details", { plan })}
              leading={<ArrowLeft className="rtl:rotate-180" aria-hidden />}
            >
              {t("back")}
            </HaloButton>
          )
        }
      >
        <p className="text-sm text-muted-foreground">{t("plan.hint")}</p>
      </StepFooter>
    </div>
  );
}
