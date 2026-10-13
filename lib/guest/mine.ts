import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { presignGet } from "@/lib/storage";

const { media } = schema;

/** What this device uploaded (and nothing else), newest first. */
export async function listMyUploads(eventId: string, deviceId: string) {
  const rows = await db
    .select({ id: media.id, r2Key: media.r2Key, thumbKey: media.thumbKey })
    .from(media)
    .where(
      and(
        eq(media.eventId, eventId),
        eq(media.deviceId, deviceId),
        eq(media.status, "ready"),
      ),
    )
    .orderBy(desc(media.createdAt))
    .limit(200);
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      src: r.thumbKey ? await presignGet(r.thumbKey, { ttl: 3600 }) : null,
    })),
  );
}
