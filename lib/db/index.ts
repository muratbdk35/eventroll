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
    // DEV/TEST ONLY: in-process Postgres (PGlite), no Neon account needed.
    // Migrations are applied automatically on first use. Never used in production (see lib/env.ts).
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    // Build workers run in parallel and cannot share one PGlite directory.
    const isBuild = process.env.NEXT_PHASE === "phase-production-build";
    const dir = isBuild ? "memory" : env.DATABASE_URL.slice("pglite:".length);
    const client = dir === "memory" ? new PGlite() : new PGlite(dir);
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

const dbPromise = globalForDb.db ?? createDb();
if (env.NODE_ENV !== "production") globalForDb.db = dbPromise;

export const db = await dbPromise;
export { schema };
