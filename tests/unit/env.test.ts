import { describe, expect, it, vi } from "vitest";

const base = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgres://u:p@host/db",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
};

async function loadParse() {
  vi.stubEnv("DATABASE_URL", base.DATABASE_URL);
  vi.stubEnv("NEXT_PUBLIC_APP_URL", base.NEXT_PUBLIC_APP_URL);
  vi.stubEnv("BETTER_AUTH_SECRET", base.BETTER_AUTH_SECRET);
  vi.stubEnv("BETTER_AUTH_URL", base.BETTER_AUTH_URL);
  return (await import("@/lib/env")).parseEnv;
}

describe("parseEnv", () => {
  it("accepts a minimal development config and applies defaults", async () => {
    const parseEnv = await loadParse();
    const env = parseEnv(base);
    expect(env.NEXT_PUBLIC_APP_NAME).toBe("EventRoll");
    expect(env.STRIPE_TAX_ENABLED).toBe(false);
    expect(env.ADMIN_EMAILS).toEqual([]);
  });

  it("normalizes the admin allowlist", async () => {
    const parseEnv = await loadParse();
    const env = parseEnv({ ...base, ADMIN_EMAILS: " A@x.com, b@y.com ,," });
    expect(env.ADMIN_EMAILS).toEqual(["a@x.com", "b@y.com"]);
  });

  it("rejects a short auth secret with a readable message", async () => {
    const parseEnv = await loadParse();
    expect(() => parseEnv({ ...base, BETTER_AUTH_SECRET: "short" })).toThrow(
      /BETTER_AUTH_SECRET: must be at least 32 characters/,
    );
  });

  it("requires third-party keys in production", async () => {
    const parseEnv = await loadParse();
    expect(() => parseEnv({ ...base, VERCEL_ENV: "production" })).toThrow(
      /STRIPE_SECRET_KEY: required in production/,
    );
  });

  it("refuses the PGlite dev database in production", async () => {
    const parseEnv = await loadParse();
    expect(() =>
      parseEnv({
        ...base,
        DATABASE_URL: "pglite:memory",
        VERCEL_ENV: "production",
      }),
    ).toThrow(/pglite is dev-only/);
  });
});
