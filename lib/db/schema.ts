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
export const plan = pgEnum("plan", ["standard", "premium"]);
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
    // eventDate + DOWNLOAD_WINDOW_DAYS (lib/plans.ts)
    expiresAt: timestamp(tz).notNull(),
    requireName: boolean().notNull().default(false),
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
    // When the guest ticked "I accept the terms / I may share these photos".
    guestConsentAt: timestamp(tz),
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
