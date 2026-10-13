import "server-only";
import { env } from "@/lib/env";

/**
 * Local-only shortcuts (demo login). Only under `next dev`, which never runs on
 * Vercel: NODE_ENV is "development" there and VERCEL_ENV is unset.
 */
export const devLoginEnabled =
  env.NODE_ENV === "development" && env.VERCEL_ENV === undefined;
