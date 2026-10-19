"use server";

import { and, eq, sql, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getLocale } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { env, isProduction } from "@/lib/env";
import { hashPin } from "@/lib/guest/session";
import {
  computeExpiresAt,
  computeExpiresAtFromEnd,
  type PlanId,
} from "@/lib/plans";
import { sendReportNotice } from "@/lib/email/report";
import { deleteObjects } from "@/lib/storage";
import { getOwnedEvent } from "./queries";
import {
  createEventSchema,
  settingsSchema,
  type CreateEventInput,
  type SettingsInput,
} from "./schemas";
import { generateSlug } from "./slug";
import { isTicketColor } from "./ticket";

const { events, media } = schema;

export type ActionResult<T = object> =
  | ({ ok: true } & T)
  | {
      ok: false;
      error:
        "unauthorized" | "invalid" | "not_found" | "forbidden" | "needs_plan";
    };

async function requireUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function createEvent(
  input: CreateEventInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const locale = await getLocale();
  for (let attempt = 0; attempt < 5; attempt++) {
    const [row] = await db
      .insert(events)
      .values({
        ownerId: user.id,
        slug: generateSlug(parsed.data.name),
        name: parsed.data.name,
        type: parsed.data.type,
        eventDate: parsed.data.eventDate,
        startsAt: new Date(parsed.data.startsAt),
        endsAt: new Date(parsed.data.endsAt),
        locale,
        expiresAt: computeExpiresAtFromEnd(new Date(parsed.data.endsAt)),
      })
      .onConflictDoNothing({ target: events.slug })
      .returning({ id: events.id });
    if (row) {
      revalidatePath("/[locale]/dashboard", "page");
      return { ok: true, id: row.id };
    }
  }
  return { ok: false, error: "invalid" };
}

/**
 * The create flow collects everything before sign-in (DECISIONS #32) and saves
 * it in one go once the host has an account: the event, then its settings.
 */
export async function createEventFromDraft(
  input: CreateEventInput,
  settings: Omit<SettingsInput, "name" | "startsAt" | "endsAt" | "eventDate">,
): Promise<ActionResult<{ id: string }>> {
  const created = await createEvent(input);
  if (!created.ok) return created;
  const saved = await updateSettings(created.id, {
    ...settings,
    name: input.name,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    eventDate: input.eventDate,
  });
  // The event exists either way; settings can still be fixed on review.
  return saved.ok ? created : { ok: true, id: created.id };
}

export async function updateSettings(
  eventId: string,
  input: SettingsInput,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const event = await getOwnedEvent(eventId, user.id);
  if (!event) return { ok: false, error: "not_found" };

  const d = parsed.data;
  await db
    .update(events)
    .set({
      name: d.name,
      requireName: d.requireName,
      eventDate: d.eventDate,
      startsAt: new Date(d.startsAt),
      endsAt: new Date(d.endsAt),
      expiresAt: computeExpiresAtFromEnd(new Date(d.endsAt), event.plan),
      uploadOpensAt: d.uploadOpensAt ? new Date(d.uploadOpensAt) : null,
      uploadClosesAt: d.uploadClosesAt ? new Date(d.uploadClosesAt) : null,
      maxUploadsPerDevice: d.maxUploadsPerDevice,
      ...(d.pin === undefined
        ? {}
        : d.pin === null
          ? { accessPinHash: null, accessPin: null }
          : { accessPinHash: await hashPin(d.pin), accessPin: d.pin }),
    })
    .where(eq(events.id, event.id));
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

/** The guest ticket's colour, on every plan (DECISIONS #42). */
export async function updateTicket(
  eventId: string,
  color: string,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };
  if (!isTicketColor(color)) return { ok: false, error: "invalid" };
  const event = await getOwnedEvent(eventId, user.id);
  if (!event) return { ok: false, error: "not_found" };
  await db
    .update(events)
    .set({ ticketColor: color })
    .where(eq(events.id, event.id));
  revalidatePath("/[locale]/dashboard", "layout");
  revalidatePath(`/[locale]/e/${event.slug}`, "page");
  return { ok: true };
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const event = await getOwnedEvent(eventId, user.id);
  if (!event) return { ok: false, error: "not_found" };

  const rows = await db
    .select({ r2Key: media.r2Key, thumbKey: media.thumbKey })
    .from(media)
    .where(eq(media.eventId, event.id));
  await deleteObjects(
    rows.flatMap((r) => (r.thumbKey ? [r.r2Key, r.thumbKey] : [r.r2Key])),
  );
  await db.transaction(async (tx) => {
    await tx
      .update(media)
      .set({ status: "deleted", uploaderIpEnc: null })
      .where(eq(media.eventId, event.id));
    await tx
      .update(events)
      .set({ status: "deleted", mediaCount: 0, storageBytes: 0 })
      .where(eq(events.id, event.id));
  });
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

/** Removes one photo (and its counters) from the host's album. */
export async function deletePhoto(
  eventId: string,
  mediaId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const event = await getOwnedEvent(eventId, user.id);
  if (!event) return { ok: false, error: "not_found" };
  await removeMedia(event.id, and(eq(media.id, mediaId)));
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

/** The host looked at a flagged photo and keeps it (DECISIONS #52). */
export async function approvePhoto(
  eventId: string,
  mediaId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const event = await getOwnedEvent(eventId, user.id);
  if (!event) return { ok: false, error: "not_found" };
  await db
    .update(media)
    .set({ moderation: "approved" })
    .where(and(eq(media.id, mediaId), eq(media.eventId, event.id)));
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

/**
 * Shows or hides the photos the explicit-image check flagged, in the grid and
 * in downloads (DECISIONS #56). Hidden by default.
 */
export async function setHideFlagged(
  eventId: string,
  hide: boolean,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const event = await getOwnedEvent(eventId, user.id);
  if (!event) return { ok: false, error: "not_found" };
  await db
    .update(events)
    .set({ hideFlagged: hide })
    .where(eq(events.id, event.id));
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

/** Deletes everything a device uploaded and blocks it from uploading again. */
export async function blockDevice(
  eventId: string,
  mediaId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const event = await getOwnedEvent(eventId, user.id);
  if (!event) return { ok: false, error: "not_found" };
  const [row] = await db
    .select({ deviceId: media.deviceId })
    .from(media)
    .where(and(eq(media.id, mediaId), eq(media.eventId, event.id)))
    .limit(1);
  if (!row?.deviceId) return { ok: false, error: "not_found" };

  await db
    .update(events)
    .set({
      blockedDeviceIds: sql`array_append(array_remove(${events.blockedDeviceIds}, ${row.deviceId}), ${row.deviceId})`,
    })
    .where(eq(events.id, event.id));
  await removeMedia(event.id, eq(media.deviceId, row.deviceId));
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

/**
 * The host reports a photo as illegal (DECISIONS #57). It is hidden at once,
 * from everyone, the host included, and the operator is emailed (no image).
 * For suspected CSAM the uploading phone is also blocked and its other photos
 * hidden too. Nothing is deleted here: the authorities may ask for it; the
 * normal deletion after the download window still applies.
 */
export async function reportPhoto(
  eventId: string,
  mediaId: string,
  reason: "csam" | "illegal",
): Promise<ActionResult> {
  if (reason !== "csam" && reason !== "illegal") {
    return { ok: false, error: "invalid" };
  }
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const event = await getOwnedEvent(eventId, user.id);
  if (!event) return { ok: false, error: "not_found" };
  const [row] = await db
    .select({
      id: media.id,
      deviceId: media.deviceId,
      status: media.status,
      createdAt: media.createdAt,
    })
    .from(media)
    .where(and(eq(media.id, mediaId), eq(media.eventId, event.id)))
    .limit(1);
  if (!row || row.status !== "ready") return { ok: false, error: "not_found" };

  const now = new Date();
  const sameDevice = reason === "csam" && row.deviceId;
  const hidden = await db.transaction(async (tx) => {
    const rows = await tx
      .update(media)
      .set({
        status: "hidden",
        reportedAt: now,
        reportReason: sql`case when ${media.id} = ${row.id} then ${reason} else 'same_device' end`,
      })
      .where(
        and(
          eq(media.eventId, event.id),
          eq(media.status, "ready"),
          sameDevice ? eq(media.deviceId, row.deviceId!) : eq(media.id, row.id),
        ),
      )
      .returning({ bytes: media.bytes });
    await tx
      .update(events)
      .set({
        mediaCount: sql`greatest(${events.mediaCount} - ${rows.length}, 0)`,
        storageBytes: sql`greatest(${events.storageBytes} - ${rows.reduce((n, r) => n + r.bytes, 0)}, 0)`,
        ...(sameDevice
          ? {
              blockedDeviceIds: sql`array_append(array_remove(${events.blockedDeviceIds}, ${row.deviceId}), ${row.deviceId})`,
            }
          : {}),
      })
      .where(eq(events.id, event.id));
    return rows.length;
  });

  // After the response: the host sees the photo gone right away.
  after(() =>
    sendReportNotice({
      reason,
      eventId: event.id,
      eventName: event.name,
      ownerEmail: user.email,
      mediaId: row.id,
      deviceId: row.deviceId,
      uploadedAt: row.createdAt,
      alsoHidden: Math.max(hidden - 1, 0),
    }).catch((e) => console.error("[report] email failed", e)),
  );
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

async function removeMedia(eventId: string, where: SQL | undefined) {
  const rows = await db
    .select({
      id: media.id,
      r2Key: media.r2Key,
      thumbKey: media.thumbKey,
      bytes: media.bytes,
      status: media.status,
    })
    .from(media)
    .where(and(eq(media.eventId, eventId), where));
  const live = rows.filter((r) => r.status === "ready");
  await deleteObjects(
    rows.flatMap((r) => (r.thumbKey ? [r.r2Key, r.thumbKey] : [r.r2Key])),
  );
  await db.transaction(async (tx) => {
    for (const r of rows) {
      await tx
        .update(media)
        .set({ status: "deleted", uploaderIpEnc: null })
        .where(eq(media.id, r.id));
    }
    if (live.length > 0) {
      await tx
        .update(events)
        .set({
          mediaCount: sql`greatest(${events.mediaCount} - ${live.length}, 0)`,
          storageBytes: sql`greatest(${events.storageBytes} - ${live.reduce((n, r) => n + r.bytes, 0)}, 0)`,
        })
        .where(eq(events.id, eventId));
    }
  });
}

/**
 * DEV ONLY: stands in for checkout until Stripe is wired up, so the upload flow
 * can be exercised locally. Refuses to run in production or when Stripe is set.
 */
export async function devActivate(
  eventId: string,
  plan: PlanId,
): Promise<ActionResult> {
  if (isProduction || env.STRIPE_SECRET_KEY) {
    return { ok: false, error: "forbidden" };
  }
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const event = await getOwnedEvent(eventId, user.id);
  if (!event) return { ok: false, error: "not_found" };
  // The plan sets how long the album stays (DECISIONS #55).
  const expiresAt = event.endsAt
    ? computeExpiresAtFromEnd(event.endsAt, plan)
    : computeExpiresAt(event.eventDate, plan);
  await db
    .update(events)
    .set({ plan, expiresAt })
    .where(eq(events.id, event.id));
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

/**
 * Opens the album to guests. Choosing a plan only records the plan; the host
 * publishes as a separate, deliberate step, and only then gets the QR code.
 */
export async function publishEvent(eventId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const event = await getOwnedEvent(eventId, user.id);
  if (!event) return { ok: false, error: "not_found" };
  if (!event.plan) return { ok: false, error: "needs_plan" };
  if (event.status !== "draft") return { ok: false, error: "invalid" };
  await db
    .update(events)
    .set({ status: "active" })
    .where(eq(events.id, event.id));
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}
