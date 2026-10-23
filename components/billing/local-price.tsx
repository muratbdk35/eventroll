"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Local = { currency: string; rate: number } | null;

// One request per page load, shared by every price on the page.
let pending: Promise<Local> | null = null;
function loadLocal(): Promise<Local> {
  // Locally `?cc=US` on the page picks a country (no geo header in dev).
  const dev = process.env.NODE_ENV !== "production" ? location.search : "";
  pending ??= fetch(`/api/local-price${dev}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((b) => (b?.currency && b.rate > 0 ? (b as Local) : null))
    .catch(() => null);
  return pending;
}

// Card issuers and Stripe add about 2-4% when converting; round up with it so
// the hint is not lower than what the visitor ends up paying.
const CONVERSION = 1.03;

/**
 * "≈ $22" after a euro price, for visitors outside the euro area
 * (DECISIONS #82). Renders nothing for euro countries or if rates fail.
 */
export function LocalPrice({
  eur,
  className,
}: {
  eur: number;
  className?: string;
}) {
  const locale = useLocale();
  const [local, setLocal] = useState<Local>(null);
  useEffect(() => {
    let live = true;
    loadLocal().then((l) => live && setLocal(l));
    return () => {
      live = false;
    };
  }, []);
  if (!local || eur <= 0) return null;
  const text = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: local.currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(Math.ceil(eur * local.rate * CONVERSION));
  return <span className={cn("whitespace-nowrap", className)}>≈ {text}</span>;
}
