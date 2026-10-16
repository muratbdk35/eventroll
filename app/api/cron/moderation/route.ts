import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { retryUnchecked } from "@/lib/moderation";

// The retry stops itself after ~45 s (Vercel's free plan allows 60).
export const maxDuration = 60;

/**
 * Nightly Vercel Cron (vercel.json): retries the explicit-image check for
 * photos that couldn't be checked at upload (DECISIONS #52). Vercel sends
 * `Authorization: Bearer <CRON_SECRET>`; anything else is refused.
 */
export async function GET(req: Request) {
  if (
    !env.CRON_SECRET ||
    req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`
  ) {
    return new NextResponse(null, { status: 401 });
  }
  const tried = await retryUnchecked();
  return NextResponse.json({ tried });
}
