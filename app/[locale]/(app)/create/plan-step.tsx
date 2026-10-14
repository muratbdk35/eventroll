"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  ReceiptCard,
  receiptCtaClass,
} from "@/components/billing/receipt-card";
import { receiptContent } from "@/components/billing/receipt-content";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { planOrder } from "@/lib/plans";
import { publicEnv } from "@/lib/public-env";
import { cn } from "@/lib/utils";
import { StepFooter, StepHeading } from "./create-flow";
import { type FlowProps, flowHref } from "./flow";

/**
 * Step 2, the paywall: the very same receipts as the landing pricing section
 * (components/billing), on the same terracotta ground (DECISIONS #32).
 */
export function PlanStep({ plan, signedIn, event }: FlowProps) {
  const t = useTranslations("Create");
  const tp = useTranslations("Landing.pricing");
  const format = useFormatter();
  const locale = useLocale();
  const upper = (s: string) => s.toLocaleUpperCase(locale);
  const nextStep = signedIn ? "pay" : "account";

  return (
    <div>
      <StepHeading title={t("plan.title")} subtitle={t("plan.subtitle")} />

      <div className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(160deg,oklch(0.64_0.17_42)_0%,oklch(0.56_0.18_36)_55%,oklch(0.47_0.16_30)_100%)] px-5 pt-12 pb-14 sm:px-10">
        <div
          aria-hidden
          className="absolute -start-32 -top-32 size-[26rem] rounded-full bg-[oklch(0.9_0.09_70/0.35)] blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -end-24 bottom-0 size-[22rem] rounded-full bg-[oklch(0.8_0.12_30/0.35)] blur-3xl"
        />
        <div
          aria-hidden
          className="absolute inset-0 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.12]"
        />

        <ol className="relative mx-auto grid max-w-3xl grid-cols-1 items-center gap-14 md:grid-cols-2 md:gap-8">
          {planOrder.map((id, i) => {
            const content = receiptContent(id, {
              t: tp as never,
              number: format.number as never,
              locale,
              appName: publicEnv.appName,
              index: i,
            });
            const chosen = plan === id;
            return (
              <li
                key={id}
                style={{ animationDelay: `${i * 140}ms` }}
                className={cn(
                  "receipt-in relative",
                  // On phones the picked plan (else the featured one) comes first.
                  (plan ? chosen : content.featured) && "order-first",
                  content.featured ? "md:order-2" : "md:order-1",
                )}
              >
                {chosen && (
                  <span className="absolute -top-9 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold whitespace-nowrap text-primary shadow-lg rtl:translate-x-1/2">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                    {t("plan.yourPick")}
                  </span>
                )}
                <ReceiptCard
                  {...content}
                  selected={chosen}
                  cta={
                    <Link
                      href={flowHref(nextStep, {
                        plan: id,
                        event: event?.id,
                      })}
                      className={receiptCtaClass(Boolean(content.featured))}
                    >
                      {upper(
                        t("plan.choose", { plan: tp(`plans.${id}.name`) }),
                      )}
                      <ArrowRight
                        className="size-4 rtl:rotate-180"
                        aria-hidden
                      />
                    </Link>
                  }
                />
              </li>
            );
          })}
        </ol>
        <p className="relative mx-auto mt-10 max-w-xl text-center text-xs text-white/75">
          {tp("footnote")}
        </p>
      </div>

      <StepFooter
        back={
          !event && (
            <Button asChild variant="ghost" className="h-10 rounded-full px-4">
              <Link href={flowHref("details", { plan })}>
                <ArrowLeft className="rtl:rotate-180" aria-hidden />
                {t("back")}
              </Link>
            </Button>
          )
        }
      >
        <p className="text-sm text-muted-foreground">{t("plan.hint")}</p>
      </StepFooter>
    </div>
  );
}
