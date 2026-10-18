import {
  BadgeCheck,
  Download,
  Lock,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { PlanReceipt } from "@/components/billing/plan-receipt";
import { planReceiptContent } from "@/components/billing/receipt-content";
import { DEFAULT_PLAN, planOrder, type PlanId } from "@/lib/plans";
import { publicEnv } from "@/lib/public-env";

// The receipt itself lives in components/billing (shared with the paywall).

const EVERY_PLAN = [
  ["guests", Users],
  ["original", Sparkles],
  ["zip", Download],
  ["moderation", ShieldCheck],
  ["oneTime", BadgeCheck],
  ["secure", Lock],
] as const;

export async function PricingReceipts() {
  const t = await getTranslations("Landing.pricing");
  const format = await getFormatter();
  const locale = await getLocale();
  // Locale-aware so Turkish gets "İ" rather than "I".
  const upper = (s: string) => s.toLocaleUpperCase(locale);
  const content = planReceiptContent({
    t: t as never,
    number: format.number as never,
    locale,
    appName: publicEnv.appName,
  });
  const each = <V,>(f: (id: PlanId) => V) =>
    Object.fromEntries(planOrder.map((id) => [id, f(id)])) as Record<PlanId, V>;

  return (
    <section
      id="pricing"
      className="relative scroll-mt-16 overflow-hidden bg-primary px-4 py-24 text-white sm:py-28"
    >
      {/* The receipt lies on a plain blue table with a fine dot texture. */}
      <div
        aria-hidden
        className="absolute inset-0 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.12]"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-16 grid gap-x-12 gap-y-4 border-t border-white/25 pt-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-end">
          <h2 className="font-heading text-[2.4rem] leading-[1.05] font-semibold tracking-[-0.02em] text-balance sm:text-6xl">
            {t("title")}
          </h2>
          <p className="max-w-md text-lg leading-relaxed text-pretty text-white/85 md:pb-2">
            {t("subtitle")}
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-14 md:grid-cols-[minmax(0,1fr)_400px] md:gap-16">
          <div className="receipt-in mx-auto w-full max-w-[400px] md:order-2">
            <PlanReceipt
              {...content}
              initial={DEFAULT_PLAN}
              hrefs={each((id) => `/create?plan=${id}`)}
              ctas={each((id) => upper(t(`plans.${id}.cta`)))}
            />
          </div>
          <div className="md:order-1">
            <p className="font-mono text-xs font-bold tracking-[0.18em] text-white/70">
              {upper(t("everyPlan"))}
            </p>
            <ul className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2 md:grid-cols-1">
              {EVERY_PLAN.map(([key, Icon]) => (
                <li key={key} className="flex items-center gap-3 text-[15px]">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/20">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  {t(`trust.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mx-auto mt-16 flex max-w-2xl items-center justify-center gap-2 text-center text-sm text-white/85">
          <QrCode className="size-4 shrink-0" aria-hidden />
          {t("howToPay")}
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-center text-xs text-white/65">
          {t("footnote")}
        </p>
      </div>
    </section>
  );
}
