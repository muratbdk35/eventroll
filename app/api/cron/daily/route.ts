import { NextResponse } from "next/server";
import { sendHostNotices } from "@/lib/email/host-notices";
import { env } from "@/lib/env";
import { purgeExpired, purgeHeld } from "@/lib/events/retention";
import { retryUnchecked } from "@/lib/moderation";

// Vercel's free plan allows 60 s; the moderation retry uses what's left.
export const maxDuration = 60;

/**
 * The daily job (vercel.json, DECISIONS #54), in order of importance:
 *   1. delete the photos of events whose download window is over, and
 *      reported photos whose evidence hold has ended (#59);
 *   2. email hosts: "album ready", then reminders 3 and 1 days before;
 *   3. retry the explicit-image check for unchecked photos (#52).
 * Vercel sends `Authorization: Bearer <CRON_SECRET>`; anything else is
 * refused. `?dry=1` reports what would happen and changes nothing.
 */
export async function GET(req: Request) {
  if (
    !env.CRON_SECRET ||
    req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`
  ) {
    return new NextResponse(null, { status: 401 });
  }
  const started = Date.now();
  const q = new URL(req.url).searchParams;
  const dryRun = q.get("dry") === "1";
  // A dry run may pretend it is another day (`&at=2026-11-01`) to preview.
  const at = dryRun && q.get("at") ? new Date(q.get("at")!) : null;
  const now = at && !Number.isNaN(at.getTime()) ? at : new Date();

  const purged = await purgeExpired({ now, dryRun });
  const heldPurged = await purgeHeld({ now, dryRun });
  const notices = await sendHostNotices({ now, dryRun });
  const left = 50_000 - (Date.now() - started);
  const moderated =
    dryRun || left < 5_000 ? 0 : await retryUnchecked(left - 3_000);

  return NextResponse.json({
    dryRun,
    purged: purged.map((p) => ({ id: p.id, name: p.name, objects: p.objects })),
    heldPurged,
    notices,
    moderated,
  });
}
