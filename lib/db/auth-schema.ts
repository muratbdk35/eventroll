// Tables managed by Better Auth (core schema, see node_modules/@better-auth/core).
// Keep in sync when adding Better Auth plugins that extend the schema.
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const tz = { withTimezone: true } as const;

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  createdAt: timestamp(tz).notNull().defaultNow(),
  updatedAt: timestamp(tz)
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const session = pgTable(
  "session",
  {
    id: text().primaryKey(),
    expiresAt: timestamp(tz).notNull(),
    token: text().notNull().unique(),
    createdAt: timestamp(tz).notNull().defaultNow(),
    updatedAt: timestamp(tz)
      .notNull()
      .$onUpdate(() => new Date()),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp(tz),
    refreshTokenExpiresAt: timestamp(tz),
    scope: text(),
    password: text(),
    createdAt: timestamp(tz).notNull().defaultNow(),
    updatedAt: timestamp(tz)
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp(tz).notNull(),
    createdAt: timestamp(tz).notNull().defaultNow(),
    updatedAt: timestamp(tz)
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);
