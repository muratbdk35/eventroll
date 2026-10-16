import "server-only";
import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  inArray,
  lte,
  ne,
  sql,
} from "drizzle-orm";
import { db, schema } from "@/lib/db";

const { events, media } = schema;

export async function listOwnedEvents(ownerId: string) {
  return db
    .select()
    .from(events)
    .where(and(eq(events.ownerId, ownerId), ne(events.status, "deleted")))
    .orderBy(desc(events.eventDate), desc(events.createdAt));
}

export async function getOwnedEvent(id: string, ownerId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.id, id),
        eq(events.ownerId, ownerId),
        ne(events.status, "deleted"),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getEventBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function getEventStats(eventId: string) {
  const [row] = await db
    .select({
      photos: count(),
      guests: countDistinct(media.deviceId),
    })
    .from(media)
    .where(and(eq(media.eventId, eventId), eq(media.status, "ready")));
  return { photos: row?.photos ?? 0, guests: row?.guests ?? 0 };
}

/**
 * Newest photo keys (thumbnail if any) for many events in one query, so the
 * dashboard doesn't run a query per event.
 */
export async function latestPhotoKeys(eventIds: string[], limit = 3) {
  const out = new Map<string, string[]>(eventIds.map((id) => [id, []]));
  if (eventIds.length === 0) return out;
  const ranked = db
    .select({
      eventId: media.eventId,
      key: sql<string>`coalesce(${media.thumbKey}, ${media.r2Key})`.as("key"),
      rank: sql<number>`row_number() over (partition by ${media.eventId} order by ${media.createdAt} desc)`.as(
        "rank",
      ),
    })
    .from(media)
    .where(
      and(
        inArray(media.eventId, eventIds),
        eq(media.status, "ready"),
        // A photo waiting for review never becomes a folder's cover (#52).
        sql`${media.moderation} is distinct from 'flagged'`,
      ),
    )
    .as("ranked");
  const rows = await db
    .select({ eventId: ranked.eventId, key: ranked.key })
    .from(ranked)
    .where(lte(ranked.rank, limit))
    .orderBy(ranked.rank);
  for (const r of rows) out.get(r.eventId)?.push(r.key);
  return out;
}

export async function listEventMedia(eventId: string, limit = 120) {
  return db
    .select()
    .from(media)
    .where(and(eq(media.eventId, eventId), eq(media.status, "ready")))
    .orderBy(desc(media.createdAt))
    .limit(limit);
}

/** Ready photos the explicit-image check flagged for review (#52). */
export async function countFlagged(eventId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(media)
    .where(
      and(
        eq(media.eventId, eventId),
        eq(media.status, "ready"),
        eq(media.moderation, "flagged"),
      ),
    );
  return row?.n ?? 0;
}

/** Photo count and bytes per uploader name (null = no name), for downloads. */
export async function mediaByUploader(eventId: string) {
  return db
    .select({
      uploaderName: media.uploaderName,
      photos: count(),
      bytes: sql<number>`coalesce(sum(${media.bytes}), 0)`.mapWith(Number),
    })
    .from(media)
    .where(and(eq(media.eventId, eventId), eq(media.status, "ready")))
    .groupBy(media.uploaderName)
    .orderBy(desc(count()));
}

/**
 * Every ready photo of an event, oldest first (the album order), optionally
 * only some ids or one uploader (`null` = guests who left no name).
 */
export async function listDownloadMedia(
  eventId: string,
  filter: { ids?: string[]; uploader?: string | null } = {},
) {
  const where = [eq(media.eventId, eventId), eq(media.status, "ready")];
  if (filter.ids) where.push(inArray(media.id, filter.ids));
  if (filter.uploader !== undefined) {
    where.push(
      filter.uploader === null
        ? sql`${media.uploaderName} is null`
        : eq(media.uploaderName, filter.uploader),
    );
  }
  return db
    .select({
      id: media.id,
      r2Key: media.r2Key,
      mime: media.mime,
      bytes: media.bytes,
      uploaderName: media.uploaderName,
      createdAt: media.createdAt,
    })
    .from(media)
    .where(and(...where))
    .orderBy(media.createdAt);
}
