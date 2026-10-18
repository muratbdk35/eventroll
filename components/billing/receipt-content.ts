import { planOrder, plans, type PlanId } from "@/lib/plans";
import type { ReceiptCardProps, Tier } from "./receipt-card";

type T = (key: string, values?: Record<string, string | number>) => string;
type NumberFormat = (n: number, opts?: Intl.NumberFormatOptions) => string;

export type ReceiptContent = Omit<
  ReceiptCardProps,
  "cta" | "dial" | "className"
>;

/**
 * Receipt text for one plan from the `Landing.pricing` messages, so the landing
 * page and the paywall print the very same receipt. Every plan prints the same
 * rows in the same order, so moving the slider only re-prints the values.
 */
export function receiptContent(
  id: PlanId,
  {
    t,
    number,
    locale,
    appName,
  }: {
    t: T;
    number: NumberFormat;
    locale: string;
    appName: string;
  },
): ReceiptContent {
  const p = plans[id];
  const tier = planOrder.indexOf(id) as Tier;
  // Locale-aware so Turkish gets "İ" rather than "I".
  const upper = (s: string) => s.toLocaleUpperCase(locale);
  const usd = (n: number, digits = 0) =>
    number(n, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  const rows: [string, string, boolean?][] = [
    [t("rows.photos"), number(p.maxItems)],
    [t("rows.storage"), `${p.maxBytes / 1024 ** 3} GB`],
    [t("rows.retention"), t("values.days", { days: p.retentionDays })],
    [t("rows.quality"), t("values.original")],
    [t("rows.zip"), "✓"],
    [t("rows.qr"), "✓"],
    [t("rows.pin"), "✓"],
    [t("rows.uploadRules"), "✓"],
    [t("rows.moderation"), "✓"],
    p.printTemplates
      ? [t("rows.templates"), "✓"]
      : [t("rows.templates"), t("values.notIncluded"), true],
  ];
  const stamp =
    id === "standard" ? t("stamp") : id === "vip" ? t("stampVip") : undefined;
  return {
    merchant: upper(appName),
    merchantLine: t("merchantLine"),
    name: upper(t(`plans.${id}.name`)),
    tagline: t(`plans.${id}.tagline`),
    rows: rows.map(([l, v, out]) => [upper(l), upper(v), out]),
    billingLabel: t("billing"),
    billingValue: t("oneTime"),
    totalLabel: t("total"),
    total: usd(p.priceUsd),
    perGuest: t("perGuest", {
      price: usd(p.priceUsd / p.guestsHint, 2),
      guests: number(p.guestsHint),
    }),
    thanks: t("thanks", { no: String(tier + 1).padStart(4, "0") }),
    stamp: stamp && upper(stamp),
    tier,
  };
}

/** Everything the slider receipt prints, for every plan (plan-receipt.tsx). */
export function planReceiptContent(opts: {
  t: T;
  number: NumberFormat;
  locale: string;
  appName: string;
}) {
  const { t, number, locale } = opts;
  const upper = (s: string) => s.toLocaleUpperCase(locale);
  const receipts = {} as Record<PlanId, ReceiptContent>;
  const guests = {} as Record<PlanId, string>;
  const valueText = {} as Record<PlanId, string>;
  for (const id of planOrder) {
    const p = plans[id];
    receipts[id] = receiptContent(id, opts);
    guests[id] = upper(
      t(id === "vip" ? "dial.guestsMax" : "dial.guests", {
        guests: number(p.guestsHint),
      }),
    );
    valueText[id] = t("dial.value", {
      plan: t(`plans.${id}.name`),
      price: receipts[id].total,
      photos: number(p.maxItems),
    });
  }
  return {
    receipts,
    dial: { label: upper(t("dial.label")), guests, valueText },
  };
}
