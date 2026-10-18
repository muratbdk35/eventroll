import { cn } from "@/lib/utils";

// Receipt layout adapted from 21st.dev "Receipt Tiers" (arihantcodes, Spectrum
// UI, Apache-2.0, https://github.com/arihantcodes/spectrum-ui). Modified by
// eventroll: rewritten in our styles, plans and translations; licence and
// credit on the third-party notices page (lib/legal/notices.ts). Shared by the
// landing pricing section and the paywall in the create flow, so both look
// exactly the same (DECISIONS #32). Pure markup: callers pass translated,
// upper-cased strings, their own CTA and, for the slider, a `dial`.

export const TORN_EDGE =
  "[clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),97%_100%,94%_calc(100%-8px),91%_100%,88%_calc(100%-8px),85%_100%,82%_calc(100%-8px),79%_100%,76%_calc(100%-8px),73%_100%,70%_calc(100%-8px),67%_100%,64%_calc(100%-8px),61%_100%,58%_calc(100%-8px),55%_100%,52%_calc(100%-8px),49%_100%,46%_calc(100%-8px),43%_100%,40%_calc(100%-8px),37%_100%,34%_calc(100%-8px),31%_100%,28%_calc(100%-8px),25%_100%,22%_calc(100%-8px),19%_100%,16%_calc(100%-8px),13%_100%,10%_calc(100%-8px),7%_100%,4%_calc(100%-8px),1%_100%,0_calc(100%-8px))]";

/*
 * The receipt "premiums up" with the tier (DECISIONS #46, #55):
 *   0 Mini      plain thermal paper;
 *   1 Standard  the plan name in reverse print and a "most chosen" stamp;
 *   2 Pro       ivory paper, a hairline frame, ink-dark reverse print;
 *   3 VIP       gold foil: double gold frame, foil name with a glint, gold
 *               seal, ticks, total, barcode and button.
 */
export type Tier = 0 | 1 | 2 | 3;

export const FOIL =
  "bg-[linear-gradient(110deg,#a8791f_0%,#e2c06a_28%,#fff0c2_44%,#d6aa4a_58%,#9c6f1c_100%)]";
const GOLD_TEXT =
  "bg-[linear-gradient(110deg,#7d5710_0%,#b8892b_40%,#d9b45a_55%,#8a6114_100%)] bg-clip-text text-transparent";

const PAPER: Record<Tier, string> = {
  0: "bg-[#fbfcfe]",
  1: "bg-[#fbfcfe]",
  2: "bg-[#fcf9f2]",
  3: "bg-[#fdf9ee]",
};

function Rule({ gold = false }: { gold?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "my-3 block border-t border-dashed transition-colors duration-500",
        gold ? "border-[#cfae5f]/60" : "border-border",
      )}
    />
  );
}

/** A value that is re-"printed" (a short drop-in) whenever it changes. */
export function Printed({ children }: { children: string }) {
  return (
    <span key={children} className="print-in inline-block">
      {children}
    </span>
  );
}

export type ReceiptCardProps = {
  merchant: string;
  merchantLine: string;
  name: string;
  tagline: string;
  /**
   * label ........ value; "✓" gets the accent. A third `true` marks a feature
   * the plan lacks: the whole line is struck through, as if by pen.
   */
  rows: [string, string, boolean?][];
  billingLabel: string;
  billingValue: string;
  totalLabel: string;
  total: string;
  perGuest?: string;
  thanks: string;
  /** Rubber stamp next to the plan name. */
  stamp?: string;
  tier?: Tier;
  /** The tier slider, printed under the header (plan-receipt.tsx). */
  dial?: React.ReactNode;
  cta: React.ReactNode;
  className?: string;
};

export function ReceiptCard({
  merchant,
  merchantLine,
  name,
  tagline,
  rows,
  billingLabel,
  billingValue,
  totalLabel,
  total,
  perGuest,
  thanks,
  stamp,
  tier = 0,
  dial,
  cta,
  className,
}: ReceiptCardProps) {
  const gold = tier === 3;
  return (
    <div className="relative">
      <div
        className={cn(
          "relative px-6 pt-8 pb-8 font-mono text-[12.5px] leading-relaxed text-[oklch(0.23_0.02_240)] transition-[background-color,box-shadow] duration-500",
          TORN_EDGE,
          PAPER[tier],
          gold
            ? "shadow-[0_40px_80px_-30px_rgb(70_45_0/0.65),0_0_0_1px_rgb(201_163_79/0.35)]"
            : "shadow-[0_30px_60px_-30px_rgb(40_10_0/0.6)]",
          className,
        )}
      >
        {/* Pro: a hairline frame. VIP: a double gold one. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-2.5 top-2.5 bottom-5 border transition-[opacity,border-color] duration-500",
            tier >= 2 ? "opacity-100" : "opacity-0",
            gold
              ? "border-[#cfae5f]/70 outline outline-1 outline-offset-[3px] outline-[#cfae5f]/30"
              : "border-[oklch(0.23_0.02_240)]/25",
          )}
        />
        <p className="text-center text-[13.5px] font-bold tracking-[0.1em]">
          {merchant}
        </p>
        <p className="mt-1 text-center text-[10.5px] tracking-[0.06em] text-[oklch(0.52_0.02_241)]">
          {merchantLine}
        </p>
        <Rule gold={gold} />
        {dial}
        {dial && <Rule gold={gold} />}
        <div className="flex min-h-8 items-center justify-between gap-3">
          <h3
            className={cn(
              "font-bold tracking-[0.08em] transition-colors duration-500",
              // Receipts emphasise with reverse print.
              tier === 1 && "-ms-1 bg-primary px-1.5 py-0.5 text-white",
              tier === 2 &&
                "-ms-1 bg-[oklch(0.23_0.02_240)] px-1.5 py-0.5 text-[#fcf9f2]",
              gold &&
                cn(
                  "foil-glint -ms-1 px-1.5 py-0.5 text-[#2b1d04] shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_1px_2px_rgb(120_80_0/0.3)]",
                  FOIL,
                ),
            )}
          >
            <Printed>{name}</Printed>
          </h3>
          {stamp && (
            <span
              key={stamp}
              className={cn(
                "stamp-in -rotate-6 rounded border-2 px-2 py-0.5 text-[10.5px] font-bold tracking-[0.14em] whitespace-nowrap",
                gold
                  ? "border-[#b8892b] text-[#8a6114] shadow-[inset_0_0_0_1px_rgb(255_240_194/0.8)]"
                  : "border-primary text-primary",
              )}
            >
              {stamp}
            </span>
          )}
        </div>
        <p className="mt-1 min-h-[1.5em] text-[11px] text-[oklch(0.52_0.02_241)]">
          <Printed>{tagline}</Printed>
        </p>
        <Rule gold={gold} />
        <ul className="space-y-1.5">
          {rows.map(([label, value, out]) => (
            <li
              key={label}
              className={cn(
                "relative flex items-baseline gap-2",
                out && "text-[oklch(0.55_0.02_241)]",
              )}
            >
              <span className="min-w-0 shrink">{label}</span>
              <span
                aria-hidden
                className="mb-1 min-w-3 flex-1 border-b border-dotted border-border"
              />
              <span
                className={cn(
                  "shrink-0 font-bold",
                  value === "✓" && (gold ? "text-[#9a6d15]" : "text-primary"),
                  out && "font-semibold",
                )}
              >
                <Printed>{value}</Printed>
              </span>
              {out && (
                <span
                  aria-hidden
                  className="strike-in pointer-events-none absolute inset-x-[-3px] top-1/2 h-[1.5px] -translate-y-1/2 -rotate-[0.6deg] rounded-full bg-[oklch(0.3_0.03_245)]"
                />
              )}
            </li>
          ))}
        </ul>
        <Rule gold={gold} />
        <div className="flex items-baseline justify-between text-[11.5px] text-[oklch(0.52_0.02_241)]">
          <span>{billingLabel}</span>
          <span>{billingValue}</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-lg font-bold">{totalLabel}</span>
          <span
            className={cn(
              "font-heading text-5xl font-extrabold tracking-tight",
              tier >= 1 && !gold && "text-primary",
              gold && GOLD_TEXT,
            )}
          >
            <Printed>{total}</Printed>
          </span>
        </div>
        {perGuest && (
          <p className="mt-1 text-end text-[11px] text-[oklch(0.52_0.02_241)]">
            <Printed>{perGuest}</Printed>
          </p>
        )}
        <Rule gold={gold} />
        {cta}
        <div
          aria-hidden
          className={cn(
            "mx-auto mt-5 h-9 w-4/5 [background-image:repeating-linear-gradient(90deg,currentColor_0,currentColor_2px,transparent_2px,transparent_5px,currentColor_5px,currentColor_6px,transparent_6px,transparent_9px)] opacity-70 transition-colors duration-500",
            gold && "text-[#9a7424]",
          )}
        />
        <p className="mt-2 text-center text-[10px] tracking-[0.2em] text-[oklch(0.52_0.02_241)]">
          {thanks}
        </p>
      </div>
    </div>
  );
}

/** The receipt's full-width button look, for links and buttons alike. */
export function receiptCtaClass(tier: Tier) {
  return cn(
    "flex w-full items-center justify-center gap-2 py-3.5 text-[12.5px] font-bold tracking-[0.1em] transition-all duration-300 active:scale-[0.98]",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60",
    tier === 3
      ? cn(
          "foil-glint text-[#2b1d04] shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_10px_24px_-10px_rgb(150_100_10/0.7)] hover:brightness-105",
          FOIL,
        )
      : tier >= 1
        ? "bg-primary text-primary-foreground shadow-[0_10px_24px_-10px_var(--primary)] hover:bg-primary/90"
        : "bg-[oklch(0.23_0.02_240)] text-white hover:bg-[oklch(0.3_0.02_240)]",
  );
}
