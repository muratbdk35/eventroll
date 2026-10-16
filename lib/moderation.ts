import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { presignGet } from "@/lib/storage";

/*
 * Explicit-image check for guest uploads (DECISIONS #52), with Sightengine's
 * nudity-2.1 model. Only its two explicit classes count: sexual_activity and
 * sexual_display (exposed genitals). Erotica and every "suggestive" class are
 * ignored, so kissing, swimwear, cleavage or dancing never flag a photo.
 * A flagged photo is never removed: the host sees it blurred and decides.
 * Without keys, or when Sightengine fails (daily quota, timeout), the photo
 * simply stays unchecked; an upload is never blocked by this.
 */

/** Sightengine's own suggestion for "very likely". */
export const FLAG_AT = 0.5;

/** Formats Sightengine reads; HEIC originals are checked via the JPEG thumb. */
const READABLE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const moderationEnabled = Boolean(
  env.SIGHTENGINE_API_USER && env.SIGHTENGINE_API_SECRET,
);

type NudityScores = { sexual_activity?: number; sexual_display?: number };

/** The higher of the two explicit scores for an image URL, or null. */
export async function explicitScore(url: string): Promise<number | null> {
  if (!moderationEnabled) return null;
  const form = new FormData();
  form.set("url", url);
  form.set("models", "nudity-2.1");
  form.set("api_user", env.SIGHTENGINE_API_USER!);
  form.set("api_secret", env.SIGHTENGINE_API_SECRET!);
  try {
    const res = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json()) as {
      status?: string;
      nudity?: NudityScores;
    };
    if (data.status !== "success" || !data.nudity) return null;
    return Math.max(
      data.nudity.sexual_activity ?? 0,
      data.nudity.sexual_display ?? 0,
    );
  } catch {
    return null;
  }
}

/** Checks one ready photo and stores the outcome. Safe to run after the response. */
export async function moderateMedia(row: {
  id: string;
  r2Key: string;
  thumbKey: string | null;
  mime: string;
}) {
  if (!moderationEnabled) return;
  const key = row.thumbKey ?? (READABLE.has(row.mime) ? row.r2Key : null);
  if (!key) return;
  const score = await explicitScore(await presignGet(key, { ttl: 600 }));
  if (score === null) return;
  await db
    .update(schema.media)
    .set({
      moderation: score >= FLAG_AT ? "flagged" : "clear",
      moderationScore: score,
    })
    .where(eq(schema.media.id, row.id));
}
