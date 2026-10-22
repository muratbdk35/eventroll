/**
 * Discount codes (DECISIONS #79). Uses DATABASE_URL (.env.local by default;
 * pass the production URL in the environment to manage live codes).
 *
 *   npm run promo -- list
 *   npm run promo -- create ELIFCAN 100 --uses 1 --until 2026-12-31 --note "Elif's wedding"
 *   npm run promo -- create LAUNCH50 50 --uses 100
 *   npm run promo -- disable ELIFCAN
 */
import { config } from "dotenv";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { promoCodes } from "../lib/db/schema.js";

config({ path: ".env.local" });
const url = process.env.DATABASE_URL;
if (!url) throw new Error("Set DATABASE_URL.");
const db = drizzle(neon(url), { casing: "snake_case" });
const host = new URL(url).host.split(".")[0];

const [cmd, ...rest] = process.argv.slice(2);
const flag = (name: string) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};

if (cmd === "list") {
  const rows = await db
    .select()
    .from(promoCodes)
    .orderBy(desc(promoCodes.createdAt));
  console.log(`codes on ${host}:`);
  for (const r of rows) {
    console.log(
      `${r.active ? " " : "x"} ${r.code.padEnd(16)} ${String(r.percentOff).padStart(3)}%  used ${r.uses}${r.maxUses === null ? "" : `/${r.maxUses}`}${r.expiresAt ? `  until ${r.expiresAt.toISOString().slice(0, 10)}` : ""}${r.note ? `  (${r.note})` : ""}`,
    );
  }
} else if (cmd === "create") {
  const [rawCode, rawPct] = rest;
  const code = (rawCode ?? "").trim().toUpperCase();
  const percentOff = Number(rawPct);
  if (
    !/^[A-Z0-9_-]{3,40}$/.test(code) ||
    !(percentOff >= 1 && percentOff <= 100)
  ) {
    throw new Error(
      "Usage: create CODE PERCENT [--uses N] [--until YYYY-MM-DD] [--note text]",
    );
  }
  const uses = flag("uses");
  const until = flag("until");
  await db.insert(promoCodes).values({
    code,
    percentOff: Math.round(percentOff),
    maxUses: uses ? Number(uses) : null,
    // End of that day, Berlin time is close enough: 23:59:59 UTC.
    expiresAt: until ? new Date(`${until}T23:59:59Z`) : null,
    note: flag("note") ?? null,
  });
  console.log(`created ${code} (${percentOff}% off) on ${host}`);
} else if (cmd === "disable") {
  const code = (rest[0] ?? "").trim().toUpperCase();
  const r = await db
    .update(promoCodes)
    .set({ active: false })
    .where(eq(promoCodes.code, code))
    .returning({ code: promoCodes.code });
  console.log(r.length ? `disabled ${code}` : `no code ${code}`);
} else {
  console.log(
    "Commands: list | create CODE PERCENT [--uses N] [--until YYYY-MM-DD] [--note text] | disable CODE",
  );
}
