import "server-only";
import { neonConfig, Pool } from "@neondatabase/serverless";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { env } from "@/lib/env";
import * as schema from "./schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { db?: Promise<Database> };

async function createDb(): Promise<Database> {
  if (env.DATABASE_URL.startsWith("pglite:")) {
    // TESTS/BUILDS ONLY: in-process Postgres (PGlite). Migrations are applied
    // on first use. Rejected in production (lib/env.ts).
    const dir = env.DATABASE_URL.slice("pglite:".length);
    const isBuild = process.env.NEXT_PHASE === "phase-production-build";
    // `next dev` (Next 16) renders routes in several processes. PGlite is
    // single-process, so a shared directory silently diverges or corrupts
    // (DECISIONS #25). Fail loudly instead.
    if (env.NODE_ENV === "development" && dir !== "memory") {
      throw new Error(
        "PGlite can't be shared by the `next dev` processes. Set DATABASE_URL " +
          "to the Neon `dev` branch in .env.local (see README › Local setup).",
      );
    }
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const client = isBuild || dir === "memory" ? new PGlite() : new PGlite(dir);
    const pgliteDb = drizzlePglite({ client, schema, casing: "snake_case" });
    await migrate(pgliteDb, { migrationsFolder: "drizzle" });
    return pgliteDb as unknown as Database;
  }

  // The WebSocket driver (not neon-http) is used because upload counters are
  // updated inside interactive transactions (spec §7.3).
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  return drizzle({ client: pool, schema, casing: "snake_case" });
}

const dbPromise =
  globalForDb.db ??
  createDb().catch((err) => {
    // Don't cache a failed connection: the next request gets a fresh attempt.
    globalForDb.db = undefined;
    throw err;
  });
if (env.NODE_ENV !== "production") globalForDb.db = dbPromise;

export const db = await dbPromise;
export { schema };
