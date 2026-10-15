"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  ReceiptCard,
  receiptCtaClass,
} from "@/components/billing/receipt-card";
import { MiniTicket } from "@/components/billing/mini-ticket";
import { receiptContent } from "@/components/billing/receipt-content";
import { HaloButton } from "@/components/halo/halo-button";
import { Link } from "@/lib/i18n/navigation";
import { planOrder, plans } from "@/lib/plans";
import { publicEnv } from "@/lib/public-env";
import { cn } from "@/lib/utils";
import { StepFooter, StepHeading } from "./create-flow";
import { type FlowProps, flowHref } from "./flow";

/**
 * Step 2, the paywall: the very same receipts as the landing pricing section
 * (components/billing), on the same blue ground (DECISIONS #32).
 */
export function PlanStep({ plan, event }: FlowProps) {
  const t = useTranslations("Create");
  const tp = useTranslations("Landing.pricing");
  const format = useFormatter();
  const locale = useLocale();
  const upper = (s: string) => s.toLocaleUpperCase(locale);

  return (
    <div>
      <StepHeading title={t("plan.title")} subtitle={t("plan.subtitle")} />

      {/* Same plain blue table as the landing pricing (DECISIONS #40). */}
      <div className="clip-round relative overflow-hidden rounded-[1.25rem] bg-primary px-5 pt-12 pb-14 sm:px-10">
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
                  attachment={
                    plans[id].ticketStyles ? (
                      <MiniTicket
                        title={tp("ticketTag.title")}
                        sub={tp("ticketTag.sub")}
                      />
                    ) : undefined
                  }
                  cta={
                    <Link
                      href={flowHref("account", {
                        plan: id,
                        event: event?.id,
                      })}
                      className={receiptCtaClass(Boolean(content.featured))}
                    >
                      {upper(
                        t("plan.choose", { plan: tp(`plans.${id}.name`) }),
                      )}
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
