"use client";

import { Slider } from "radix-ui";
import { useState } from "react";
import { Link } from "@/lib/i18n/navigation";
import { planOrder, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";
import {
  FOIL,
  SILVER,
  Printed,
  ReceiptCard,
  receiptCtaClass,
  type Tier,
} from "./receipt-card";
import type { ReceiptContent } from "./receipt-content";

/*
 * One receipt with a plan dial printed on it (DECISIONS #55). Sliding re-prints
 * the values in place and the paper itself "premiums up" with the tier, from
 * plain thermal paper (Mini) to gold foil (VIP). Shared by the landing pricing
 * and the paywall; everything is precomputed by the caller, per plan.
 */
export type PlanReceiptProps = {
  receipts: Record<PlanId, ReceiptContent>;
  /** Where each plan's button goes, and what it says (upper-cased). */
  hrefs: Record<PlanId, string>;
  ctas: Record<PlanId, string>;
  dial: {
    label: string;
    /** "≈ 150 GUESTS" per plan. */
    guests: Record<PlanId, string>;
    /** What a screen reader announces for each stop. */
    valueText: Record<PlanId, string>;
  };
  initial: PlanId;
};

// Half the thumb: Radix keeps the thumb inside the track, so the stops sit
// this far in from each end.
const HALF = 10;
const at = (i: number) =>
  `calc(${HALF}px + (100% - ${HALF * 2}px) * ${i / (planOrder.length - 1)})`;

export function PlanReceipt({
  receipts,
  hrefs,
  ctas,
  dial,
  initial,
}: PlanReceiptProps) {
  const [index, setIndex] = useState(() => planOrder.indexOf(initial));
  const id = planOrder[index];
  const tier = index as Tier;
  const gold = tier === 3;

  function pick(i: number) {
    if (i === index) return;
    setIndex(i);
    // A tiny detent on phones that support it (Android).
    try {
      navigator.vibrate?.(6);
    } catch {}
  }

  const silver = tier === 2;
  const ink = gold
    ? "bg-[#9a7424]"
    : silver
      ? "bg-[#4a5563]"
      : "bg-[oklch(0.23_0.02_240)]";

  return (
    <ReceiptCard
      {...receipts[id]}
      dial={
        <div>
          <div className="flex items-baseline justify-between gap-3 text-[10.5px] tracking-[0.12em] text-[oklch(0.52_0.02_241)]">
            <span id="plan-dial-label">{dial.label}</span>
            <span className="font-bold text-[oklch(0.23_0.02_240)]">
              <Printed>{dial.guests[id]}</Printed>
            </span>
          </div>

          <Slider.Root
            min={0}
            max={planOrder.length - 1}
            step={1}
            value={[index]}
            onValueChange={([v]) => pick(v)}
            aria-labelledby="plan-dial-label"
            className="relative mt-3 flex h-8 w-full touch-none items-center select-none"
          >
            <Slider.Track className="relative h-px grow border-t border-dashed border-[oklch(0.23_0.02_240)]/35">
              <Slider.Range
                className={cn(
                  "absolute -top-px h-[2px] transition-colors duration-500",
                  ink,
                )}
              />
            </Slider.Track>
            {/* The stops: perforation ticks, inked once passed. */}
            {planOrder.map((p, i) => (
              <span
                key={p}
                aria-hidden
                style={{ left: at(i) }}
                className={cn(
                  "pointer-events-none absolute top-1/2 h-2.5 w-[2px] -translate-x-1/2 -translate-y-1/2 transition-colors duration-300",
                  i <= index ? ink : "bg-[oklch(0.23_0.02_240)]/25",
                )}
              />
            ))}
            <Slider.Thumb
              // The role="slider" element is the thumb; the root's label
              // doesn't reach it.
              aria-labelledby="plan-dial-label"
              aria-valuetext={dial.valueText[id]}
              className={cn(
                "relative block size-5 cursor-grab rounded-full border-2 transition-[background-color,border-color,box-shadow] duration-500 outline-none active:cursor-grabbing",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfcfe]",
                // A bigger, invisible grip for thumbs.
                "after:absolute after:-inset-3 after:content-['']",
                gold
                  ? cn(
                      "foil-glint border-[#9a7424] shadow-[0_2px_6px_rgb(120_80_0/0.45)]",
                      FOIL,
                    )
                  : silver
                    ? cn(
                        "foil-glint border-[#4a5563] shadow-[0_2px_6px_rgb(20_30_45/0.4)]",
                        SILVER,
                      )
                    : "border-[oklch(0.23_0.02_240)] bg-[#fbfcfe] shadow-[0_2px_6px_rgb(20_30_45/0.25)]",
              )}
            />
          </Slider.Root>

          {/* Tappable names under the stops; the slider itself is the
              accessible control, so these stay out of the tab order. */}
          <div aria-hidden className="relative mt-1 h-5">
            {planOrder.map((p, i) => (
              <button
                key={p}
                type="button"
                tabIndex={-1}
                onClick={() => pick(i)}
                style={{ left: at(i) }}
                className={cn(
                  "absolute top-0 -translate-x-1/2 px-1 py-0.5 text-[10.5px] tracking-[0.1em] whitespace-nowrap transition-colors duration-300",
                  i === index
                    ? cn(
                        "font-bold",
                        gold
                          ? "text-[#8a6114]"
                          : silver
                            ? "text-[#3b4654]"
                            : "text-[oklch(0.23_0.02_240)]",
                      )
                    : "text-[oklch(0.55_0.02_241)] hover:text-[oklch(0.23_0.02_240)]",
                )}
              >
                {receipts[p].name}
              </button>
            ))}
          </div>
        </div>
      }
      cta={
        <Link href={hrefs[id]} className={receiptCtaClass(tier)}>
          <Printed>{ctas[id]}</Printed>
        </Link>
      }
    />
  );
}
