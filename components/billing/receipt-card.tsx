import { cn } from "@/lib/utils";

// Receipt layout adapted from 21st.dev "Receipt Tiers" (arihantcodes, Spectrum
// UI, Apache-2.0, https://github.com/arihantcodes/spectrum-ui). Modified by
// eventroll: rewritten in our styles, plans and translations; licence and
// credit on the third-party notices page (lib/legal/notices.ts). Shared by the landing pricing section and the paywall in the create
// flow, so both look exactly the same (DECISIONS #32). Pure markup: callers
// pass translated, upper-cased strings and their own CTA.

export const TORN_EDGE =
  "[clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),97%_100%,94%_calc(100%-8px),91%_100%,88%_calc(100%-8px),85%_100%,82%_calc(100%-8px),79%_100%,76%_calc(100%-8px),73%_100%,70%_calc(100%-8px),67%_100%,64%_calc(100%-8px),61%_100%,58%_calc(100%-8px),55%_100%,52%_calc(100%-8px),49%_100%,46%_calc(100%-8px),43%_100%,40%_calc(100%-8px),37%_100%,34%_calc(100%-8px),31%_100%,28%_calc(100%-8px),25%_100%,22%_calc(100%-8px),19%_100%,16%_calc(100%-8px),13%_100%,10%_calc(100%-8px),7%_100%,4%_calc(100%-8px),1%_100%,0_calc(100%-8px))]";

function Rule() {
  return (
    <span
      aria-hidden
      className="my-3 block border-t border-dashed border-border"
    />
  );
}

export type ReceiptCardProps = {
  merchant: string;
  merchantLine: string;
  name: string;
  tagline: string;
  /** label ........ value; "✓" and "✗" get their own colours. */
  rows: [string, string][];
  billingLabel: string;
  billingValue: string;
  totalLabel: string;
  total: string;
  perGuest?: string;
  thanks: string;
  /** Rubber stamp next to the plan name. */
  stamp?: string;
  featured?: boolean;
  /** Extra emphasis when used as a selectable option. */
  selected?: boolean;
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
  featured = false,
  selected = false,
  cta,
  className,
}: ReceiptCardProps) {
  return (
    <div
      className={cn(
        "relative bg-[#fbfcfe] px-6 pt-8 pb-8 font-mono text-[12.5px] leading-relaxed text-[oklch(0.23_0.02_240)] transition-transform duration-300 hover:-translate-y-1",
        TORN_EDGE,
        featured
          ? "shadow-[0_40px_80px_-30px_rgb(40_10_0/0.7)] md:scale-[1.06] md:rotate-[1deg]"
          : "shadow-[0_30px_60px_-30px_rgb(40_10_0/0.6)] md:-rotate-1",
        selected && "-translate-y-1",
        className,
      )}
    >
      <p className="text-center text-[13.5px] font-bold tracking-[0.1em]">
        {merchant}
      </p>
      <p className="mt-1 text-center text-[10.5px] tracking-[0.06em] text-[oklch(0.52_0.02_241)]">
        {merchantLine}
      </p>
      <Rule />
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold tracking-[0.08em]">{name}</h3>
        {stamp && (
          <span className="-rotate-6 rounded border-2 border-primary px-2 py-0.5 text-[10.5px] font-bold tracking-[0.14em] whitespace-nowrap text-primary">
            {stamp}
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] text-[oklch(0.52_0.02_241)]">{tagline}</p>
      <Rule />
      <ul className="space-y-1.5">
        {rows.map(([label, value]) => (
          <li key={label} className="flex items-baseline gap-2">
            <span className="min-w-0 shrink">{label}</span>
            <span
              aria-hidden
              className="mb-1 min-w-3 flex-1 border-b border-dotted border-border"
            />
            <span
              className={cn(
                "shrink-0 font-bold",
                value === "✓" && "text-primary",
                value === "✗" && "font-normal text-[oklch(0.7_0.02_241)]",
              )}
            >
              {value}
            </span>
          </li>
        ))}
      </ul>
      <Rule />
      <div className="flex items-baseline justify-between text-[11.5px] text-[oklch(0.52_0.02_241)]">
        <span>{billingLabel}</span>
        <span>{billingValue}</span>
      </div>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-lg font-bold">{totalLabel}</span>
        <span
          className={cn(
            "font-heading text-5xl font-extrabold tracking-tight",
            featured && "text-primary",
          )}
        >
          {total}
        </span>
      </div>
      {perGuest && (
        <p className="mt-1 text-end text-[11px] text-[oklch(0.52_0.02_241)]">
          {perGuest}
        </p>
      )}
      <Rule />
      {cta}
      <div
        aria-hidden
        className="mx-auto mt-5 h-9 w-4/5 [background-image:repeating-linear-gradient(90deg,currentColor_0,currentColor_2px,transparent_2px,transparent_5px,currentColor_5px,currentColor_6px,transparent_6px,transparent_9px)] opacity-70"
      />
      <p className="mt-2 text-center text-[10px] tracking-[0.2em] text-[oklch(0.52_0.02_241)]">
        {thanks}
      </p>
    </div>
  );
}

/** The receipt's full-width button look, for links and buttons alike. */
export function receiptCtaClass(featured: boolean) {
  return cn(
    "flex w-full items-center justify-center gap-2 py-3.5 text-[12.5px] font-bold tracking-[0.1em] transition-all active:scale-[0.98]",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60",
    featured
      ? "bg-primary text-primary-foreground shadow-[0_10px_24px_-10px_var(--primary)] hover:bg-primary/90"
      : "bg-[oklch(0.23_0.02_240)] text-white hover:bg-[oklch(0.3_0.02_240)]",
  );
}
