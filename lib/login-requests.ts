import "server-only";
import { generateRandomString } from "better-auth/crypto";
import { and, eq, gt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";

/**
 * Cross-device magic links (DECISIONS #34). The tab that asks for the link
 * opens a login request; the link in the email (opened on any device) approves
 * it; the waiting tab polls, and once approved gets a one-time sign-in URL of
 * its own. Rows live in Better Auth's `verification` table, so no migration.
 *
 * The request id is 192 random bits, known only to the waiting tab and to
 * whoever can read the email, i.e. the people who could sign in anyway.
 */

const PREFIX = "login-request:";
const TTL_MS = 15 * 60_000;

type RequestValue = {
  email: string;
  /** Same-site path to land on after signing in, e.g. "/tr/create?step=pay". */
  next: string;
  status: "pending" | "approved" | "claimed";
};

const { verification } = schema;

async function find(id: string) {
  const [row] = await db
    .select()
    .from(verification)
    .where(
      and(
        eq(verification.identifier, PREFIX + id),
        gt(verification.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return row ? { row, value: JSON.parse(row.value) as RequestValue } : null;
}

async function save(rowId: string, value: RequestValue) {
  await db
    .update(verification)
    .set({ value: JSON.stringify(value) })
    .where(eq(verification.id, rowId));
}

/** Only paths on this site with a locale prefix; anything else goes home. */
export function safeNext(next: unknown, locale: string): string {
  return typeof next === "string" &&
    next.startsWith(`/${locale}/`) &&
    !next.startsWith("//") &&
    !next.includes("\\")
    ? next
    : `/${locale}/dashboard`;
}

export async function createLoginRequest(email: string, next: string) {
  const id = generateRandomString(32, "a-z", "A-Z", "0-9");
  await db.insert(verification).values({
    id: generateRandomString(32, "a-z", "0-9"),
    identifier: PREFIX + id,
    value: JSON.stringify({
      email: email.trim().toLowerCase(),
      next,
      status: "pending",
    } satisfies RequestValue),
    expiresAt: new Date(Date.now() + TTL_MS),
  });
  return id;
}

/** Called on the "email confirmed" page by the signed-in clicker. */
export async function approveLoginRequest(id: string, email: string) {
  const found = await find(id);
  if (!found) return null;
  if (found.value.email !== email.toLowerCase()) return null;
  if (found.value.status === "pending") {
    await save(found.row.id, { ...found.value, status: "approved" });
  }
  return found.value.next;
}

/**
 * Polled by the waiting tab. Once approved, hands out (once) a sign-in URL
 * that goes through Better Auth's normal magic-link verification.
 */
export async function claimLoginRequest(
  id: string,
  origin: string,
): Promise<
  { status: "pending" | "expired" } | { status: "approved"; url: string }
> {
  const found = await find(id);
  if (!found || found.value.status === "claimed") return { status: "expired" };
  if (found.value.status === "pending") return { status: "pending" };

  await save(found.row.id, { ...found.value, status: "claimed" });
  const token = generateRandomString(32, "a-z", "A-Z");
  const ctx = await auth.$context;
  await ctx.internalAdapter.createVerificationValue({
    // Same shape the magic-link plugin stores (see app/api/dev-login).
    identifier: `magic-link:${token}`,
    value: JSON.stringify({ type: "magic-link", email: found.value.email }),
    expiresAt: new Date(Date.now() + 60_000),
  });
  const verify = new URL("/api/auth/magic-link/verify", origin);
  verify.searchParams.set("token", token);
  verify.searchParams.set("callbackURL", found.value.next);
  return { status: "approved", url: verify.toString() };
}
