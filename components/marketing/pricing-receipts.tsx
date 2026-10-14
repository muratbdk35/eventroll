import {
  ArrowRight,
  Download,
  Lock,
  QrCode,
  Receipt,
  Sparkles,
} from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import {
  ReceiptCard,
  receiptCtaClass,
} from "@/components/billing/receipt-card";
import { receiptContent } from "@/components/billing/receipt-content";
import { DOWNLOAD_WINDOW_DAYS, planOrder } from "@/lib/plans";
import { publicEnv } from "@/lib/public-env";
import { cn } from "@/lib/utils";

// The receipts themselves live in components/billing (shared with the paywall).

export async function PricingReceipts() {
  const t = await getTranslations("Landing.pricing");
  const format = await getFormatter();
  const locale = await getLocale();
  // Locale-aware so Turkish gets "İ" rather than "I".
  const upper = (s: string) => s.toLocaleUpperCase(locale);
  const trust = [
    { icon: Lock, label: t("trust.secure") },
    { icon: Receipt, label: t("trust.oneTime") },
    { icon: Sparkles, label: t("trust.original") },
    { icon: Download, label: t("trust.zip", { days: DOWNLOAD_WINDOW_DAYS }) },
  ];

  return (
    <section
      id="pricing"
      className="relative scroll-mt-16 overflow-hidden bg-[linear-gradient(160deg,oklch(0.64_0.17_42)_0%,oklch(0.56_0.18_36)_55%,oklch(0.47_0.16_30)_100%)] px-4 py-24 text-white sm:py-28"
    >
      {/* soft light + dot texture */}
      <div
        aria-hidden
        className="absolute -start-40 -top-40 size-[34rem] rounded-full bg-[oklch(0.9_0.09_70/0.35)] blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -end-32 bottom-0 size-[28rem] rounded-full bg-[oklch(0.8_0.12_30/0.35)] blur-3xl"
      />
      <div
        aria-hidden
        className="absolute inset-0 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.12]"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium ring-1 ring-white/25 backdrop-blur">
            <Receipt className="size-4" aria-hidden />
            {t("eyebrow")}
          </span>
          <h2 className="mt-5 font-heading text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
            {t("title")}
          </h2>
          <p className="mt-5 text-lg text-pretty text-white/85">
            {t("subtitle")}
          </p>
        </div>

        <ol className="mx-auto grid max-w-3xl grid-cols-1 items-center gap-14 md:grid-cols-2 md:gap-8">
          {planOrder.map((id, i) => {
            const content = receiptContent(id, {
              t: t as never,
              number: format.number as never,
              locale,
              appName: publicEnv.appName,
              index: i,
            });
            return (
              <li
                key={id}
                style={{ animationDelay: `${i * 140}ms` }}
                className={cn(
                  "receipt-in relative",
                  content.featured ? "order-first md:order-2" : "md:order-1",
                )}
              >
                <ReceiptCard
                  {...content}
                  cta={
                    <Link
                      href={`/create?plan=${id}`}
                      className={receiptCtaClass(Boolean(content.featured))}
                    >
                      {upper(t(`plans.${id}.cta`))}
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

        <ul className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-3 text-sm md:grid-cols-4">
          {trust.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2.5 rounded-2xl bg-white/12 px-4 py-3 ring-1 ring-white/20 backdrop-blur"
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="text-white/95">{label}</span>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-8 flex max-w-2xl items-center justify-center gap-2 text-center text-sm text-white/85">
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
