import "server-only";
import { env, isProduction } from "@/lib/env";

/** Local-only shortcuts (demo login, free plan activation). Never in production. */
export const devLoginEnabled =
  !isProduction &&
  env.NODE_ENV !== "production" &&
  env.DATABASE_URL.startsWith("pglite:");
