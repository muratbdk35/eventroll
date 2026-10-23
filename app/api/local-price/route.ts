import { NextResponse } from "next/server";

/*
 * The visitor's currency and today's rate from the euro, for the "≈ $22" hint
 * next to prices (DECISIONS #82). Prices stay in euros; this is only a guide.
 * The country comes from Vercel's geo header, the rates from the ECB's daily
 * reference rates (via Frankfurter, no key, nothing about the visitor sent).
 */

// Countries outside the euro area whose currency the ECB publishes.
const CURRENCY: Record<string, string> = {
  US: "USD", GB: "GBP", TR: "TRY", CH: "CHF", LI: "CHF", PL: "PLN",
  CZ: "CZK", HU: "HUF", RO: "RON", SE: "SEK", DK: "DKK", NO: "NOK",
  IS: "ISK", CA: "CAD", AU: "AUD", NZ: "NZD", JP: "JPY", CN: "CNY",
  HK: "HKD", SG: "SGD", KR: "KRW", IN: "INR", ID: "IDR", IL: "ILS",
  MX: "MXN", BR: "BRL", ZA: "ZAR", TH: "THB", PH: "PHP", MY: "MYR",
}; // prettier-ignore

async function rates(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch("https://api.frankfurter.dev/v1/latest?base=EUR", {
      next: { revalidate: 6 * 3600 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { rates?: Record<string, number> };
    return body.rates ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  let country = req.headers.get("x-vercel-ip-country")?.toUpperCase() ?? "";
  // Locally there is no geo header: `?cc=US` stands in for it.
  if (process.env.NODE_ENV !== "production") {
    country = new URL(req.url).searchParams.get("cc")?.toUpperCase() ?? "";
  }
  const currency = CURRENCY[country];
  const rate = currency ? (await rates())?.[currency] : undefined;
  return NextResponse.json(rate ? { currency, rate } : { currency: null }, {
    // Per visitor (it depends on where they are), so never shared caches.
    headers: { "Cache-Control": "private, max-age=3600" },
  });
}
