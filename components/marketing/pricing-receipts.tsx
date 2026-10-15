import { QrCode } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import {
  ReceiptCard,
  receiptCtaClass,
} from "@/components/billing/receipt-card";
import { MiniTicket } from "@/components/billing/mini-ticket";
import { receiptContent } from "@/components/billing/receipt-content";
import { planOrder, plans } from "@/lib/plans";
import { publicEnv } from "@/lib/public-env";
import { cn } from "@/lib/utils";

// The receipts themselves live in components/billing (shared with the paywall).

export async function PricingReceipts() {
  const t = await getTranslations("Landing.pricing");
  const format = await getFormatter();
  const locale = await getLocale();
  // Locale-aware so Turkish gets "İ" rather than "I".
  const upper = (s: string) => s.toLocaleUpperCase(locale);

  return (
    <section
      id="pricing"
      className="relative scroll-mt-16 overflow-hidden bg-primary px-4 py-24 text-white sm:py-28"
    >
      {/* The receipts lie on a plain blue table with a fine dot texture. */}
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
                  attachment={
                    plans[id].ticketStyles ? (
                      <MiniTicket
                        title={t("ticketTag.title")}
                        sub={t("ticketTag.sub")}
                      />
                    ) : undefined
                  }
                  cta={
                    <Link
                      href={`/create?plan=${id}`}
                      className={receiptCtaClass(Boolean(content.featured))}
                    >
                      {upper(t(`plans.${id}.cta`))}
                    </Link>
                  }
                />
              </li>
            );
          })}
        </ol>

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
