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
    .where(and(inArray(media.eventId, eventIds), eq(media.status, "ready")))
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
