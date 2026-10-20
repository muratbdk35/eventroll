#!/usr/bin/env node
/**
 * Launch day (docs/LAUNCH.md): pushes the production environment variables
 * to Vercel from one local file, without printing any value.
 *
 *   node scripts/launch-env.mjs ~/eventroll/.env.production.launch [--dry]
 *
 * The file holds KEY=value lines (quotes are stripped). Secrets the app makes
 * up itself (BETTER_AUTH_SECRET, CRON_SECRET, FINGERPRINT_SALT) are generated
 * when missing. NEXT_PUBLIC_* values are added as plain variables, everything
 * else as "sensitive". Delete the file afterwards.
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

const [file, flag] = process.argv.slice(2);
if (!file) {
  console.error("Usage: node scripts/launch-env.mjs <file> [--dry]");
  process.exit(1);
}
const dry = flag === "--dry";

const vals = {};
for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) vals[m[1]] = m[2].replace(/^["'“”‘’]+|["'“”‘’]+$/g, "");
}

for (const k of ["BETTER_AUTH_SECRET", "CRON_SECRET", "FINGERPRINT_SALT"]) {
  if (!vals[k]) vals[k] = randomBytes(32).toString("base64url");
}

const REQUIRED = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_APP_NAME",
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "DATABASE_URL",
  "CRON_SECRET",
  "FINGERPRINT_SALT",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_ENDPOINT",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  // SUPPORT_EMAIL, UPSTASH_* and SIGHTENGINE_* are already in Vercel
  // Production (docs/LAUNCH.md step 1); add them here only to replace them.
];
const missing = REQUIRED.filter((k) => !vals[k]);
if (missing.length) {
  console.error("Missing in the file:", missing.join(", "));
  process.exit(1);
}
if (!vals.STRIPE_SECRET_KEY.startsWith("rk_live_")) {
  console.error("STRIPE_SECRET_KEY must be a live restricted key (rk_live_…).");
  process.exit(1);
}
if (!vals.NEXT_PUBLIC_APP_URL.startsWith("https://")) {
  console.error("NEXT_PUBLIC_APP_URL must be https://…");
  process.exit(1);
}

for (const [name, value] of Object.entries(vals)) {
  const sensitive = !name.startsWith("NEXT_PUBLIC_");
  const args = [
    "-y",
    "vercel",
    "env",
    "add",
    name,
    "--environment",
    "production",
    "--force",
    "--yes",
  ];
  // Public values (Turnstile site key) must be marked as such.
  if (!sensitive) args.push("--type", "config");
  if (sensitive) args.push("--sensitive");
  if (dry) {
    console.log(`would add ${name}${sensitive ? " (sensitive)" : ""}`);
    continue;
  }
  const r = spawnSync("npx", args, { input: value, encoding: "utf8" });
  console.log(`${name}: ${r.status === 0 ? "added" : "FAILED"}`);
}
