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
 *   2 Pro       silver: cool paper, a steel frame with corner marks, a
 *               silver-foil name with a glint, steel seal, total and
 *               gunmetal button;
 *   3 VIP       gold foil: double gold frame, foil name with a glint, gold
 *               seal, ticks, total, barcode and button.
 */
export type Tier = 0 | 1 | 2 | 3;

export const FOIL =
  "bg-[linear-gradient(110deg,#a8791f_0%,#e2c06a_28%,#fff0c2_44%,#d6aa4a_58%,#9c6f1c_100%)]";
export const SILVER =
  "bg-[linear-gradient(110deg,#8d97a5_0%,#d5dbe3_28%,#ffffff_44%,#b9c2cd_58%,#7a8492_100%)]";
// Gradient text sits on the printed span itself: a clipped background on a
// parent doesn't reach a child that animates (the VIP total vanished).
const GOLD_TEXT =
  "bg-[linear-gradient(110deg,#7d5710_0%,#b8892b_40%,#d9b45a_55%,#8a6114_100%)] bg-clip-text text-transparent";
const SILVER_TEXT =
  "bg-[linear-gradient(110deg,#2c3642_0%,#5d6b7c_40%,#93a0b0_55%,#38434f_100%)] bg-clip-text text-transparent";

const PAPER: Record<Tier, string> = {
  0: "bg-[#fbfcfe]",
  1: "bg-[#fbfcfe]",
  2: "bg-[#f6f8fb]",
  3: "bg-[#fdf9ee]",
};

/** The highlighter swept under the values that change between plans. */
const MARK: Record<Tier, string> = {
  0: "bg-[oklch(0.23_0.02_240)]/10",
  1: "bg-primary/15",
  2: "bg-[#8d97a5]/30",
  3: "bg-[#d9b45a]/35",
};

const RULE: Record<Tier, string> = {
  0: "border-border",
  1: "border-border",
  2: "border-[#9aa5b3]/60",
  3: "border-[#cfae5f]/60",
};

function Rule({ tier }: { tier: Tier }) {
  return (
    <span
      aria-hidden
      className={cn(
        "my-3 block border-t border-dashed transition-colors duration-500",
        RULE[tier],
      )}
    />
  );
}

/** A value that is re-"printed" (a short drop-in) whenever it changes. */
export function Printed({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <span key={children} className={cn("print-in inline-block", className)}>
      {children}
    </span>
  );
}

/** Pro's frame corners, like the marks on an engraved certificate. */
function Corners() {
  return (
    <>
      {[
        "top-1.5 left-1.5 border-t border-l",
        "top-1.5 right-1.5 border-t border-r",
        "bottom-4 left-1.5 border-b border-l",
        "bottom-4 right-1.5 border-b border-r",
      ].map((c) => (
        <span
          key={c}
          aria-hidden
          className={cn(
            "pointer-events-none absolute size-3 border-[#6f7c8c]",
            c,
          )}
        />
      ))}
    </>
  );
}

export type ReceiptCardProps = {
  merchant: string;
  merchantLine: string;
  name: string;
  tagline: string;
  /**
   * label ........ value; "✓" gets the accent. A third `true` marks a feature
   * the plan lacks: the whole line is struck through, as if by pen. A fourth
   * `true` marks a value that changes between plans: printed larger, with a
   * highlighter swept under it each time it changes.
   */
  rows: [string, string, boolean?, boolean?][];
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
  const silver = tier === 2;
  return (
    <div className="relative">
      <div
        className={cn(
          "relative px-6 pt-8 pb-8 font-mono text-[12.5px] leading-relaxed text-[oklch(0.23_0.02_240)] transition-[background-color,box-shadow] duration-500",
          TORN_EDGE,
          PAPER[tier],
          gold
            ? "shadow-[0_40px_80px_-30px_rgb(70_45_0/0.65),0_0_0_1px_rgb(201_163_79/0.35)]"
            : silver
              ? "shadow-[0_36px_70px_-30px_rgb(15_25_40/0.65),0_0_0_1px_rgb(141_151_165/0.4)]"
              : "shadow-[0_30px_60px_-30px_rgb(40_10_0/0.6)]",
          className,
        )}
      >
        {/* Pro: a steel frame with corner marks. VIP: a double gold one. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-2.5 top-2.5 bottom-5 border transition-[opacity,border-color] duration-500",
            tier >= 2 ? "opacity-100" : "opacity-0",
            gold
              ? "border-[#cfae5f]/70 outline outline-1 outline-offset-[3px] outline-[#cfae5f]/30"
              : "border-[#8d97a5]/55",
          )}
        />
        {silver && <Corners />}
        <p className="text-center text-[13.5px] font-bold tracking-[0.1em]">
          {merchant}
        </p>
        <p className="mt-1 text-center text-[10.5px] tracking-[0.06em] text-[oklch(0.52_0.02_241)]">
          {merchantLine}
        </p>
        <Rule tier={tier} />
        {dial}
        {dial && <Rule tier={tier} />}
        <div className="flex min-h-8 items-center justify-between gap-3">
          <h3
            className={cn(
              "font-bold tracking-[0.08em] transition-colors duration-500",
              // Receipts emphasise with reverse print.
              tier === 1 && "-ms-1 bg-primary px-1.5 py-0.5 text-white",
              silver &&
                cn(
                  "foil-glint -ms-1 px-1.5 py-0.5 text-[#1d2633] shadow-[inset_0_1px_0_rgb(255_255_255/0.8),0_1px_2px_rgb(20_30_45/0.3)]",
                  SILVER,
                ),
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
                  : silver
                    ? "border-[#5d6b7c] text-[#3b4654]"
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
        <Rule tier={tier} />
        <ul className="space-y-1.5">
          {rows.map(([label, value, out, key]) => (
            <li
              key={label}
              className={cn(
                "relative flex items-baseline gap-2",
                out && "text-[oklch(0.55_0.02_241)]",
                key && "font-semibold",
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
                  value === "✓" &&
                    (gold
                      ? "text-[#9a6d15]"
                      : silver
                        ? "text-[#4a5563]"
                        : "text-primary"),
                  out && "font-semibold",
                  key && "relative text-[15px] font-extrabold",
                )}
              >
                {key && (
                  <span
                    key={value}
                    aria-hidden
                    className={cn(
                      "mark-in absolute inset-y-0 -right-0.5 -left-2 -skew-x-6 rounded-[2px] transition-colors duration-500",
                      MARK[tier],
                    )}
                  />
                )}
                <Printed className={key ? "relative" : undefined}>
                  {value}
                </Printed>
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
        <Rule tier={tier} />
        <div className="flex items-baseline justify-between text-[11.5px] text-[oklch(0.52_0.02_241)]">
          <span>{billingLabel}</span>
          <span>{billingValue}</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-lg font-bold">{totalLabel}</span>
          <span className="font-heading text-5xl font-extrabold tracking-tight">
            <Printed
              className={cn(
                tier === 1 && "text-primary",
                silver && SILVER_TEXT,
                gold && GOLD_TEXT,
              )}
            >
              {total}
            </Printed>
          </span>
        </div>
        {perGuest && (
          <p className="mt-1 text-end text-[11px] text-[oklch(0.52_0.02_241)]">
            <Printed>{perGuest}</Printed>
          </p>
        )}
        <Rule tier={tier} />
        {cta}
        <div
          aria-hidden
          className={cn(
            "mx-auto mt-5 h-9 w-4/5 [background-image:repeating-linear-gradient(90deg,currentColor_0,currentColor_2px,transparent_2px,transparent_5px,currentColor_5px,currentColor_6px,transparent_6px,transparent_9px)] opacity-70 transition-colors duration-500",
            gold && "text-[#9a7424]",
            silver && "text-[#4a5563]",
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
      : tier === 2
        ? "foil-glint bg-[linear-gradient(180deg,#46525f_0%,#262f3a_100%)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_24px_-10px_rgb(20_30_45/0.8)] hover:brightness-110"
        : tier === 1
          ? "bg-primary text-primary-foreground shadow-[0_10px_24px_-10px_var(--primary)] hover:bg-primary/90"
          : "bg-[oklch(0.23_0.02_240)] text-white hover:bg-[oklch(0.3_0.02_240)]",
  );
}
