import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "test",
    BETTER_AUTH_SECRET: "x".repeat(32),
    FINGERPRINT_SALT: undefined,
  },
}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
import { generateSlug } from "@/lib/events/slug";
import { createEventSchema, settingsSchema } from "@/lib/events/schemas";
import { getUploadState } from "@/lib/events/upload-state";
import { isAllowedMime, originalKey } from "@/lib/uploads";
import { parseGuestCookie } from "@/lib/guest/session";

describe("generateSlug", () => {
  it("makes a readable ascii prefix with a random suffix", () => {
    const s = generateSlug("Ayşe & Müller'in Düğünü");
    expect(s).toMatch(/^[a-z0-9-]+-[a-z2-9]{6}$/);
    expect(s.startsWith("ayse-muller-in-dugunu")).toBe(true);
  });
  it("works for names with no ascii letters", () => {
    expect(generateSlug("婚礼")).toMatch(/^[a-z2-9]{6}$/);
  });
  it("is not repeatable", () => {
    expect(generateSlug("Party")).not.toBe(generateSlug("Party"));
  });
});

describe("schemas", () => {
  it("validates create input", () => {
    expect(
      createEventSchema.safeParse({
        name: "  Anna & Tom ",
        eventDate: "2026-06-14",
        type: "wedding",
      }).success,
    ).toBe(true);
    expect(
      createEventSchema.safeParse({ name: "", eventDate: "x", type: "wedding" })
        .success,
    ).toBe(false);
  });
  it("rejects bad pins and inverted windows", () => {
    const base = {
      name: "x",
      requireName: false,
      uploadOpensAt: null,
      uploadClosesAt: null,
      maxUploadsPerDevice: null,
    };
    expect(settingsSchema.safeParse({ ...base, pin: "12" }).success).toBe(
      false,
    );
    expect(settingsSchema.safeParse({ ...base, pin: "1234" }).success).toBe(
      true,
    );
    expect(
      settingsSchema.safeParse({
        ...base,
        uploadOpensAt: "2026-06-14T20:00:00.000Z",
        uploadClosesAt: "2026-06-14T10:00:00.000Z",
      }).success,
    ).toBe(false);
  });
});

describe("getUploadState", () => {
  const now = new Date("2026-06-14T12:00:00Z");
  const base = {
    status: "active" as const,
    plan: "standard" as const,
    uploadOpensAt: null,
    uploadClosesAt: null,
    expiresAt: new Date("2026-06-21T23:59:59Z"),
  };
  it("is open for a paid, active event", () => {
    expect(getUploadState(base, now)).toBe("open");
  });
  it("requires a plan", () => {
    expect(getUploadState({ ...base, plan: null, status: "draft" }, now)).toBe(
      "needs_plan",
    );
  });
  it("honours the upload window", () => {
    expect(
      getUploadState(
        { ...base, uploadOpensAt: new Date("2026-06-14T18:00:00Z") },
        now,
      ),
    ).toBe("not_open_yet");
    expect(
      getUploadState(
        { ...base, uploadClosesAt: new Date("2026-06-14T11:00:00Z") },
        now,
      ),
    ).toBe("closed");
  });
  it("handles expiry and takedowns", () => {
    expect(
      getUploadState({ ...base, expiresAt: new Date("2026-06-10Z") }, now),
    ).toBe("expired");
    expect(getUploadState({ ...base, status: "suspended" }, now)).toBe(
      "unavailable",
    );
  });
});

describe("uploads", () => {
  it("allows photos only", () => {
    expect(isAllowedMime("image/heic")).toBe(true);
    expect(isAllowedMime("video/mp4")).toBe(false);
    expect(isAllowedMime("image/svg+xml")).toBe(false);
  });
  it("builds event-scoped keys", () => {
    expect(originalKey("e1", "m1", "image/png")).toBe(
      "events/e1/m1/original.png",
    );
  });
});

describe("guest cookie", () => {
  it("rejects garbage and tampering", () => {
    expect(parseGuestCookie("e1", undefined)).toBeNull();
    expect(parseGuestCookie("e1", "a.1.b")).toBeNull();
    expect(parseGuestCookie("e1", "dev.123.sig")).toBeNull();
  });
});
