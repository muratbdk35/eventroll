import "server-only";
import { and, asc, eq, isNull, lt, sql } from "drizzle-orm";
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

/**
 * Off until the owner switches it on (DECISIONS #80): the site says "coming
 * soon" meanwhile. MODERATION_ENABLED=true plus the keys turn it on.
 */
export const moderationEnabled =
  env.MODERATION_ENABLED === "true" &&
  Boolean(env.SIGHTENGINE_API_USER && env.SIGHTENGINE_API_SECRET);

type NudityScores = { sexual_activity?: number; sexual_display?: number };

/**
 * One check. `throttled` means Sightengine's per-second limit (the free plan
 * allows very few requests at once), which says nothing about the photo.
 */
export async function explicitScore(
  url: string,
): Promise<{ score: number } | { error: "throttled" | "failed" }> {
  if (!moderationEnabled) return { error: "failed" };
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
      error?: { type?: string; code?: number; message?: string };
    };
    if (data.status !== "success" || !data.nudity) {
      if (
        data.error?.type === "usage_limit" &&
        /throttl/i.test(data.error.message ?? "")
      ) {
        return { error: "throttled" };
      }
      console.warn(
        `[moderation] check failed: ${data.error?.type ?? res.status} ${data.error?.message ?? ""}`,
      );
      return { error: "failed" };
    }
    return {
      score: Math.max(
        data.nudity.sexual_activity ?? 0,
        data.nudity.sexual_display ?? 0,
      ),
    };
  } catch (e) {
    console.warn(`[moderation] check failed: ${(e as Error).message}`);
    return { error: "failed" };
  }
}

/** Tries per photo, the first at upload included; then it stays unchecked. */
export const MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Checks one ready photo and stores the outcome. Safe to run after the
 * response. When Sightengine throttles (a guest sending 30 photos at once),
 * it waits and asks again a few times; a throttled check doesn't use up one
 * of the photo's MAX_ATTEMPTS, any other failure does, so a photo that can't
 * be read stops being retried.
 */
export async function moderateMedia(row: {
  id: string;
  r2Key: string;
  thumbKey: string | null;
  mime: string;
}) {
  if (!moderationEnabled) return;
  const { media } = schema;
  const key = row.thumbKey ?? (READABLE.has(row.mime) ? row.r2Key : null);
  if (!key) {
    // Nothing Sightengine can read (HEIC without a preview): never retry.
    await db
      .update(media)
      .set({ moderationAttempts: MAX_ATTEMPTS })
      .where(eq(media.id, row.id));
    return;
  }
  const url = await presignGet(key, { ttl: 900 });
  let result = await explicitScore(url);
  for (
    let i = 1;
    i <= 4 && "error" in result && result.error === "throttled";
    i++
  ) {
    await sleep(800 * i + Math.random() * 1200);
    result = await explicitScore(url);
  }
  // Still throttled: leave it for the nightly retry without using an attempt.
  if ("error" in result && result.error === "throttled") return;
  await db
    .update(media)
    .set({
      moderationAttempts: sql`${media.moderationAttempts} + 1`,
      ...("score" in result
        ? {
            moderation: result.score >= FLAG_AT ? "flagged" : "clear",
            moderationScore: result.score,
          }
        : {}),
    })
    .where(eq(media.id, row.id));
}

/**
 * The nightly retry (DECISIONS #52): ready photos still unchecked and tried
 * fewer than MAX_ATTEMPTS times, least-tried first. One at a time with a short gap
 * (Sightengine's per-second limit), stopping before `budgetMs` so the
 * function ends in time; whatever is left waits for the next night.
 * Returns how many were tried.
 */
export async function retryUnchecked(budgetMs = 45_000) {
  if (!moderationEnabled) return 0;
  const { media } = schema;
  const started = Date.now();
  const rows = await db
    .select({
      id: media.id,
      r2Key: media.r2Key,
      thumbKey: media.thumbKey,
      mime: media.mime,
    })
    .from(media)
    .where(
      and(
        eq(media.status, "ready"),
        isNull(media.moderation),
        lt(media.moderationAttempts, MAX_ATTEMPTS),
      ),
    )
    // Never-tried photos first, so failing ones can't crowd out new ones.
    .orderBy(asc(media.moderationAttempts), asc(media.createdAt))
    .limit(200);
  let tried = 0;
  for (const row of rows) {
    if (Date.now() - started > budgetMs) break;
    await moderateMedia(row);
    tried++;
    await sleep(1100);
  }
  return tried;
}
