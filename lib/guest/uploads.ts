import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { encryptIp } from "./ip";
import { getUploadState, type UploadState } from "@/lib/events/upload-state";
import { plans } from "@/lib/plans";
import {
  deleteObjects,
  headObject,
  presignPut,
  type PresignedPut,
} from "@/lib/storage";
import {
  MAX_FILE_BYTES,
  MAX_THUMB_BYTES,
  originalKey,
  thumbKey,
  type AllowedMime,
} from "@/lib/uploads";

const { events, media } = schema;
type EventRow = typeof events.$inferSelect;

export type Denial = UploadState | "blocked" | "device_limit" | "event_full";

/** Everything that can stop a guest from uploading, in priority order. */
export function uploadDenial(event: EventRow, deviceId: string): Denial | null {
  const state = getUploadState(event);
  if (state !== "open") return state;
  if (event.blockedDeviceIds.includes(deviceId)) return "blocked";
  return null;
}

export function fingerprint(ip: string, ua: string): string {
  return createHash("sha256")
    .update(`${env.FINGERPRINT_SALT ?? env.BETTER_AUTH_SECRET}|${ip}|${ua}`)
    .digest("hex")
    .slice(0, 32);
}

export type PresignFile = {
  type: AllowedMime;
  size: number;
  thumbSize?: number;
};

export type PresignResult =
  | {
      ok: true;
      uploads: {
        mediaId: string;
        original: PresignedPut;
        thumb: PresignedPut | null;
      }[];
    }
  | { ok: false; reason: "device_limit" | "event_full" };

export async function createPendingUploads(opts: {
  event: EventRow;
  deviceId: string;
  fingerprint: string;
  ip: string;
  uploaderName: string | null;
  consentAt: Date;
  files: PresignFile[];
}): Promise<PresignResult> {
  const { event, files } = opts;
  const limits = plans[event.plan ?? "standard"];

  const [deviceCount] = await db
    .select({ n: count() })
    .from(media)
    .where(
      and(
        eq(media.eventId, event.id),
        eq(media.deviceId, opts.deviceId),
        inArray(media.status, ["ready", "pending"]),
      ),
    );
  if (
    event.maxUploadsPerDevice !== null &&
    (deviceCount?.n ?? 0) + files.length > event.maxUploadsPerDevice
  ) {
    return { ok: false, reason: "device_limit" };
  }
  // Cheap early check; the authoritative one runs atomically in confirm.
  const bytes = files.reduce((n, f) => n + f.size, 0);
  if (
    event.mediaCount + files.length > limits.maxItems ||
    event.storageBytes + bytes > limits.maxBytes
  ) {
    return { ok: false, reason: "event_full" };
  }

  const rows = files.map((f) => {
    const id = randomUUID();
    return {
      id,
      eventId: event.id,
      r2Key: originalKey(event.id, id, f.type),
      thumbKey: f.thumbSize ? thumbKey(event.id, id) : null,
      mime: f.type,
      bytes: f.size,
      uploaderName: opts.uploaderName,
      guestConsentAt: opts.consentAt,
      deviceId: opts.deviceId,
      uploaderFingerprint: opts.fingerprint,
      uploaderIpEnc: encryptIp(opts.ip, env.IP_ENCRYPTION_KEY),
    };
  });
  await db.insert(media).values(rows);

  const uploads = await Promise.all(
    rows.map(async (r, i) => ({
      mediaId: r.id,
      original: await presignPut({
        key: r.r2Key,
        contentType: r.mime,
        contentLength: r.bytes,
      }),
      thumb: r.thumbKey
        ? await presignPut({
            key: r.thumbKey,
            contentType: "image/jpeg",
            contentLength: files[i].thumbSize!,
          })
        : null,
    })),
  );
  return { ok: true, uploads };
}

export type ConfirmResult =
  | {
      ok: true;
      /** The ready photo, for the explicit-image check (null if it was ready already). */
      ready: {
        id: string;
        r2Key: string;
        thumbKey: string | null;
        mime: string;
      } | null;
    }
  | {
      ok: false;
      reason: "not_found" | "missing_file" | "device_limit" | "event_full";
    };

/**
 * Verifies the object really landed in storage with the declared size, then
 * flips the row to `ready` and bumps the event counters in one transaction.
 */
export async function confirmUpload(opts: {
  event: EventRow;
  deviceId: string;
  mediaId: string;
  width?: number;
  height?: number;
}): Promise<ConfirmResult> {
  const { event } = opts;
  const [row] = await db
    .select()
    .from(media)
    .where(
      and(
        eq(media.id, opts.mediaId),
        eq(media.eventId, event.id),
        eq(media.deviceId, opts.deviceId),
      ),
    )
    .limit(1);
  if (!row || row.status === "deleted" || row.status === "hidden") {
    return { ok: false, reason: "not_found" };
  }
  if (row.status === "ready") return { ok: true, ready: null }; // idempotent

  const head = await headObject(row.r2Key);
  if (!head || head.size !== row.bytes || head.size > MAX_FILE_BYTES) {
    await discard(row);
    return { ok: false, reason: "missing_file" };
  }
  let thumb = row.thumbKey;
  if (thumb) {
    const th = await headObject(thumb);
    if (!th || th.size === 0 || th.size > MAX_THUMB_BYTES) {
      await deleteObjects([thumb]);
      thumb = null;
    }
  }

  const limits = plans[event.plan ?? "standard"];
  const result = await db.transaction(async (tx) => {
    // Counter update only succeeds while the event still has room.
    const bumped = await tx
      .update(events)
      .set({
        mediaCount: sql`${events.mediaCount} + 1`,
        storageBytes: sql`${events.storageBytes} + ${row.bytes}`,
      })
      .where(
        and(
          eq(events.id, event.id),
          sql`${events.mediaCount} < ${limits.maxItems}`,
          sql`${events.storageBytes} + ${row.bytes} <= ${limits.maxBytes}`,
          // Re-checked here so parallel uploads can't overshoot the per-phone cap.
          event.maxUploadsPerDevice === null
            ? undefined
            : sql`(select count(*) from ${media} where ${media.eventId} = ${event.id} and ${media.deviceId} = ${opts.deviceId} and ${media.status} = 'ready') < ${event.maxUploadsPerDevice}`,
        ),
      )
      .returning({ id: events.id });
    if (bumped.length === 0) return "full" as const;
    await tx
      .update(media)
      .set({
        status: "ready",
        thumbKey: thumb,
        width: opts.width ?? null,
        height: opts.height ?? null,
      })
      .where(and(eq(media.id, row.id), eq(media.status, "pending")));
    return "ok" as const;
  });

  if (result === "full") {
    await discard({ ...row, thumbKey: thumb });
    const limitHit =
      event.maxUploadsPerDevice !== null && event.mediaCount < limits.maxItems;
    return { ok: false, reason: limitHit ? "device_limit" : "event_full" };
  }
  return {
    ok: true,
    ready: { id: row.id, r2Key: row.r2Key, thumbKey: thumb, mime: row.mime },
  };
}

async function discard(row: {
  id: string;
  r2Key: string;
  thumbKey: string | null;
}) {
  await deleteObjects(row.thumbKey ? [row.r2Key, row.thumbKey] : [row.r2Key]);
  await db
    .update(media)
    .set({ status: "deleted", uploaderIpEnc: null })
    .where(eq(media.id, row.id));
}
