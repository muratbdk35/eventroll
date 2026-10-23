import {
  CURRENCY,
  LAUNCH_OFF,
  planOrder,
  plans,
  salePrice,
  type PlanId,
} from "@/lib/plans";
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
  const money = (n: number, digits = 0) =>
    number(n, {
      style: "currency",
      currency: CURRENCY,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  // The first four change from plan to plan and are printed larger.
  const rows: [string, string, boolean?, boolean?][] = [
    [t("rows.photos"), number(p.maxItems), false, true],
    [t("rows.storage"), `${p.maxBytes / 1024 ** 3} GB`, false, true],
    [
      t("rows.retention"),
      t("values.days", { days: p.retentionDays }),
      false,
      true,
    ],
    // 24 hours, 48 on VIP (#77): guests upload only during the event.
    [
      t("rows.uploadWindow"),
      t("values.hours", { hours: p.maxEventHours }),
      false,
      true,
    ],
    [t("rows.quality"), t("values.original")],
    [t("rows.zip"), "✓"],
    [t("rows.qr"), "✓"],
    [t("rows.pin"), "✓"],
    [t("rows.uploadRules"), "✓"],
    // Off until it is switched on (#80).
    [t("rows.moderation"), t("values.soon")],
    p.printTemplates
      ? [t("rows.templates"), "✓"]
      : [t("rows.templates"), t("values.notIncluded"), true],
  ];
  const stamp =
    id === "standard"
      ? t("stamp")
      : id === "pro"
        ? t("stampPro")
        : id === "vip"
          ? t("stampVip")
          : undefined;
  return {
    merchant: upper(appName),
    merchantLine: t("merchantLine"),
    name: upper(t(`plans.${id}.name`)),
    tagline: t(`plans.${id}.tagline`),
    rows: rows.map(([l, v, out, key]) => [upper(l), upper(v), out, key]),
    billingLabel: t("billing"),
    billingValue: t("oneTime"),
    totalLabel: t("total"),
    total: money(salePrice(id)),
    amount: salePrice(id),
    ...(LAUNCH_OFF > 0
      ? {
          wasTotal: money(p.price),
          offerLabel: upper(t("launchLabel")),
          offerValue: `−${money(LAUNCH_OFF)}`,
        }
      : {}),
    perGuest: t("perGuest", {
      price: money(salePrice(id) / p.guestsHint, 2),
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
