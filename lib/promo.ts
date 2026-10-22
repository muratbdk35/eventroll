import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const { promoCodes } = schema;

/** Codes are typed loosely: spaces and case don't matter. */
export function normalizeCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export type Promo = { code: string; percentOff: number };

/** A code that can be used right now, or null (#79). */
export async function findPromo(raw: string): Promise<Promo | null> {
  const code = normalizeCode(raw);
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return null;
  const [row] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.code, code))
    .limit(1);
  if (!row || !row.active) return null;
  if (row.expiresAt && row.expiresAt <= new Date()) return null;
  if (row.maxUses !== null && row.uses >= row.maxUses) return null;
  return { code: row.code, percentOff: row.percentOff };
}

/**
 * Counts one use when an order with the code is paid (or switched on for
 * free). Never above the limit, even when two orders finish at once.
 */
export async function countPromoUse(code: string) {
  await db
    .update(promoCodes)
    .set({ uses: sql`${promoCodes.uses} + 1` })
    .where(
      and(
        eq(promoCodes.code, code),
        sql`(${promoCodes.maxUses} is null or ${promoCodes.uses} < ${promoCodes.maxUses})`,
      ),
    );
}
