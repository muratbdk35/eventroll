import "server-only";
import { and, eq, isNull, lte, ne, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { deleteObjects } from "@/lib/storage";

/*
 * The download window ends (DECISIONS #54): once `expiresAt` has passed,
 * every photo, preview and cover of the event is permanently deleted from
 * storage, and what ties guests to it (names, device ids, fingerprints,
 * consent times, blocked devices, the readable PIN) is cleared, as the
 * privacy policy promises. The event row stays, marked `expired`, so the
 * host's dashboard and any invoice still make sense.
 */

const { events, media } = schema;

export type PurgePlan = {
  id: string;
  name: string;
  expiresAt: Date;
  objects: number;
};

/** Events whose window is over and whose files are still there. */
async function due(now: Date, limit: number) {
  return db
    .select({
      id: events.id,
      name: events.name,
      expiresAt: events.expiresAt,
      coverKey: events.coverKey,
      status: events.status,
    })
    .from(events)
    .where(
      and(
        lte(events.expiresAt, now),
        isNull(events.purgedAt),
        ne(events.status, "deleted"),
      ),
    )
    .orderBy(events.expiresAt)
    .limit(limit);
}

async function keysFor(eventId: string, coverKey: string | null) {
  const rows = await db
    .select({ r2Key: media.r2Key, thumbKey: media.thumbKey })
    .from(media)
    // Rows already "deleted" had their files removed at the time.
    .where(and(eq(media.eventId, eventId), ne(media.status, "deleted")));
  const keys = rows.flatMap((r) =>
    r.thumbKey ? [r.r2Key, r.thumbKey] : [r.r2Key],
  );
  if (coverKey) keys.push(coverKey);
  return keys;
}

/**
 * Deletes what is due. With `dryRun` nothing is touched: it only reports
 * which events would be purged and how many files each holds.
 */
export async function purgeExpired({
  now = new Date(),
  dryRun = false,
  limit = 50,
}: { now?: Date; dryRun?: boolean; limit?: number } = {}): Promise<
  PurgePlan[]
> {
  const plan: PurgePlan[] = [];
  for (const ev of await due(now, limit)) {
    const keys = await keysFor(ev.id, ev.coverKey);
    plan.push({
      id: ev.id,
      name: ev.name,
      expiresAt: ev.expiresAt,
      objects: keys.length,
    });
    if (dryRun) continue;

    await deleteObjects(keys);
    await db.transaction(async (tx) => {
      await tx
        .update(media)
        .set({
          status: "deleted",
          uploaderName: null,
          deviceId: null,
          uploaderFingerprint: null,
          uploaderIpEnc: null,
          guestConsentAt: null,
        })
        .where(eq(media.eventId, ev.id));
      await tx
        .update(events)
        .set({
          status: ev.status === "suspended" ? "suspended" : "expired",
          mediaCount: 0,
          storageBytes: 0,
          coverKey: null,
          accessPin: null,
          blockedDeviceIds: sql`'{}'::text[]`,
          purgedAt: now,
        })
        .where(eq(events.id, ev.id));
    });
  }
  return plan;
}
