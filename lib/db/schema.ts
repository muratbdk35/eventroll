import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

const tz = { withTimezone: true } as const;
const id = () =>
  uuid()
    .primaryKey()
    .default(sql`gen_random_uuid()`);
const createdAt = () => timestamp(tz).notNull().defaultNow();

export const eventType = pgEnum("event_type", [
  "wedding",
  "birthday",
  "corporate",
  "baby_shower",
  "graduation",
  "party",
  "other",
]);
// No free plan (DECISIONS #16): events.plan stays null until a purchase.
export const plan = pgEnum("plan", ["mini", "standard", "pro", "vip"]);
// "suspended" extends the spec's list so admins can take an event down (DECISIONS.md #5).
export const eventStatus = pgEnum("event_status", [
  "draft",
  "active",
  "expired",
  "deleted",
  "suspended",
]);
export const mediaStatus = pgEnum("media_status", [
  "pending",
  "ready",
  "hidden",
  "deleted",
]);
export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "refunded",
  "failed",
]);
export const reportReason = pgEnum("report_reason", [
  "inappropriate",
  "illegal",
  "privacy",
  "other",
]);
export const reportStatus = pgEnum("report_status", [
  "open",
  "actioned",
  "dismissed",
]);
export const guestMessageStatus = pgEnum("guest_message_status", [
  "visible",
  "hidden",
  "deleted",
]);

export const events = pgTable(
  "events",
  {
    id: id(),
    ownerId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: text().notNull().unique(),
    name: text().notNull(),
    type: eventType().notNull().default("other"),
    // Local calendar date of the start (kept for display and older rows).
    eventDate: date({ mode: "string" }).notNull(),
    // Required for new events (create form); null only on rows made before.
    startsAt: timestamp(tz),
    endsAt: timestamp(tz),
    locale: text().notNull().default("en"),
    plan: plan(),
    status: eventStatus().notNull().default("draft"),
    uploadOpensAt: timestamp(tz),
    uploadClosesAt: timestamp(tz),
    // end of event + the plan's retentionDays (lib/plans.ts)
    expiresAt: timestamp(tz).notNull(),
    requireName: boolean().notNull().default(false),
    // Photos the explicit-image check flagged stay out of the host's grid and
    // downloads until approved; the host can show them (DECISIONS #56).
    hideFlagged: boolean().notNull().default(true),
    // Guest access controls (DECISIONS #21): optional PIN, upload window above,
    // and a per-device photo cap (null = unlimited).
    accessPinHash: text(),
    /** The PIN itself, so it can be printed on the QR cards (DECISIONS #34).
     *  Guests are told it anyway; checks still use the hash. */
    accessPin: text(),
    maxUploadsPerDevice: integer(),
    // Devices the host blocked from uploading (media.device_id values).
    blockedDeviceIds: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    coverKey: text(),
    // Guest ticket colour id (lib/events/ticket.ts); null = powder blue.
    // Every plan can choose it (DECISIONS #42).
    ticketColor: text(),
    // Unused since patterns were dropped (#42); kept so no data is lost.
    ticketPattern: text(),
    storageBytes: bigint({ mode: "number" }).notNull().default(0),
    mediaCount: integer().notNull().default(0),
    // Host emails sent by the daily job (DECISIONS #54), each at most once.
    albumReadyMailAt: timestamp(tz),
    reminder3MailAt: timestamp(tz),
    reminder1MailAt: timestamp(tz),
    // When the daily job deleted the photos after the download window.
    purgedAt: timestamp(tz),
    createdAt: createdAt(),
    updatedAt: timestamp(tz)
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("events_owner_id_idx").on(t.ownerId),
    index("events_status_expires_at_idx").on(t.status, t.expiresAt),
  ],
);

export const media = pgTable(
  "media",
  {
    id: id(),
    eventId: uuid()
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    r2Key: text().notNull(),
    thumbKey: text(),
    previewKey: text(),
    mime: text().notNull(),
    bytes: bigint({ mode: "number" }).notNull(),
    width: integer(),
    height: integer(),
    uploaderName: text(),
    // Event-scoped random device id from the signed guest cookie.
    deviceId: text(),
    uploaderFingerprint: text(),
    // The uploader's IP, encrypted (lib/guest/ip.ts, DECISIONS #58); only
    // decrypted for a legal request. Cleared with the photo.
    uploaderIpEnc: text(),
    // When the guest ticked "I accept the terms / I may share these photos".
    guestConsentAt: timestamp(tz),
    // Automatic check for explicit images (DECISIONS #52): null = not
    // checked, "clear", "flagged" (shown blurred to the host), "approved"
    // (the host looked and kept it). `moderationScore` is the higher of
    // Sightengine's sexual_activity / sexual_display, 0–1.
    moderation: text(),
    moderationScore: real(),
    // Checks tried so far; capped so a photo is never retried endlessly.
    moderationAttempts: integer().notNull().default(0),
    // Reported as illegal by the host (DECISIONS #57): the photo is then
    // `hidden`, seen by no one, and the operator is told by email. Reason
    // "csam", "illegal", or "same_device" for the other photos of a phone
    // whose photo was reported as CSAM.
    reportedAt: timestamp(tz),
    reportReason: text(),
    status: mediaStatus().notNull().default("pending"),
    createdAt: createdAt(),
  },
  (t) => [
    index("media_event_id_created_at_idx").on(t.eventId, t.createdAt),
    index("media_event_id_device_id_idx").on(t.eventId, t.deviceId),
    index("media_status_created_at_idx").on(t.status, t.createdAt),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: id(),
    eventId: uuid()
      .notNull()
      .references(() => events.id),
    ownerId: text()
      .notNull()
      .references(() => user.id),
    stripeSessionId: text().notNull().unique(),
    stripePaymentIntentId: text(),
    plan: plan().notNull(),
    amountTotal: integer(),
    currency: text(),
    status: orderStatus().notNull().default("pending"),
    // EU consumer law: buyer's consent to immediate performance + waiver of
    // the 14-day withdrawal right, captured at checkout (DECISIONS.md #2).
    withdrawalWaiverAt: timestamp(tz),
    // gclid / UTM captured on first touch, for ad attribution.
    attribution: jsonb().$type<Record<string, string>>(),
    createdAt: createdAt(),
    paidAt: timestamp(tz),
  },
  (t) => [index("orders_event_id_idx").on(t.eventId)],
);

export const reports = pgTable(
  "reports",
  {
    id: id(),
    mediaId: uuid().references(() => media.id, { onDelete: "set null" }),
    eventId: uuid()
      .notNull()
      .references(() => events.id),
    reason: reportReason().notNull(),
    details: text(),
    reporterContact: text(),
    status: reportStatus().notNull().default("open"),
    createdAt: createdAt(),
    resolvedAt: timestamp(tz),
  },
  (t) => [index("reports_status_created_at_idx").on(t.status, t.createdAt)],
);

// Phase 2
export const guestMessages = pgTable(
  "guest_messages",
  {
    id: id(),
    eventId: uuid()
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    authorName: text(),
    body: text().notNull(),
    status: guestMessageStatus().notNull().default("visible"),
    createdAt: createdAt(),
  },
  (t) => [index("guest_messages_event_id_idx").on(t.eventId)],
);

export const emailLog = pgTable(
  "email_log",
  {
    id: id(),
    eventId: uuid().references(() => events.id, { onDelete: "set null" }),
    userId: text().references(() => user.id, { onDelete: "set null" }),
    template: text().notNull(),
    sentAt: timestamp(tz).notNull().defaultNow(),
    providerId: text(),
  },
  (t) => [index("email_log_event_template_idx").on(t.eventId, t.template)],
);
