import { DOWNLOAD_WINDOW_DAYS, plans, type PlanId } from "@/lib/plans";
import type { ReceiptCardProps } from "./receipt-card";

/** Guest count used for the "per guest" framing. */
export const RECEIPT_GUESTS = 150;
export const FEATURED_PLAN: PlanId = "premium";

type T = (key: string, values?: Record<string, string | number>) => string;
type NumberFormat = (n: number, opts?: Intl.NumberFormatOptions) => string;

/**
 * Receipt text for one plan from the `Landing.pricing` messages, so the landing
 * page and the paywall print the very same receipt.
 */
export function receiptContent(
  id: PlanId,
  {
    t,
    number,
    locale,
    appName,
    index,
  }: {
    t: T;
    number: NumberFormat;
    locale: string;
    appName: string;
    index: number;
  },
): Omit<ReceiptCardProps, "cta" | "selected" | "className"> {
  const p = plans[id];
  // Locale-aware so Turkish gets "İ" rather than "I".
  const upper = (s: string) => s.toLocaleUpperCase(locale);
  const usd = (n: number, digits = 0) =>
    number(n, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  const featured = id === FEATURED_PLAN;
  const rows: [string, string][] = [
    [t("rows.photos"), number(p.maxItems)],
    [t("rows.storage"), `${p.maxBytes / 1024 ** 3} GB`],
    [t("rows.quality"), t("values.original")],
    [t("rows.zip"), t("values.days", { days: DOWNLOAD_WINDOW_DAYS })],
    [t("rows.qr"), "✓"],
    [t("rows.pin"), "✓"],
    [t("rows.uploadRules"), "✓"],
    [t("rows.templates"), p.printTemplates ? "✓" : "✗"],
  ];
  return {
    merchant: upper(appName),
    merchantLine: t("merchantLine"),
    name: upper(t(`plans.${id}.name`)),
    tagline: t(`plans.${id}.tagline`),
    rows: rows.map(([l, v]) => [upper(l), upper(v)]),
    billingLabel: t("billing"),
    billingValue: t("oneTime"),
    totalLabel: t("total"),
    total: usd(p.priceUsd),
    perGuest: t("perGuest", {
      price: usd(p.priceUsd / RECEIPT_GUESTS, 2),
      guests: RECEIPT_GUESTS,
    }),
    thanks: t("thanks", { no: String(index + 1).padStart(4, "0") }),
    stamp: featured ? upper(t("stamp")) : undefined,
    featured,
  };
}
