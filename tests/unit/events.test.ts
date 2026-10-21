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
import { adjustEnd, clampEnd, endAfter, maxEnd } from "@/lib/events/times";
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
  const times = {
    startsAt: "2026-06-14T16:00:00.000Z",
    endsAt: "2026-06-14T23:00:00.000Z",
    eventDate: "2026-06-14",
  };

  it("validates create input", () => {
    expect(
      createEventSchema.safeParse({
        name: "  Anna & Tom ",
        type: "wedding",
        ...times,
      }).success,
    ).toBe(true);
    expect(
      createEventSchema.safeParse({ name: "", type: "wedding", ...times })
        .success,
    ).toBe(false);
  });

  it("requires the end after the start and caps it at 24 hours", () => {
    const base = { name: "x", type: "party" as const, eventDate: "2026-06-14" };
    expect(
      createEventSchema.safeParse({
        ...base,
        startsAt: "2026-06-14T20:00:00.000Z",
        endsAt: "2026-06-14T19:00:00.000Z",
      }).success,
    ).toBe(false);
    expect(
      createEventSchema.safeParse({
        ...base,
        startsAt: "2026-06-14T20:00:00.000Z",
        endsAt: "2026-06-15T21:00:00.000Z",
      }).success,
    ).toBe(false);
    expect(
      createEventSchema.safeParse({
        ...base,
        startsAt: "2026-06-14T20:00:00.000Z",
        endsAt: "2026-06-15T20:00:00.000Z",
      }).success,
    ).toBe(true);
  });

  it("rejects bad pins and events that are too long", () => {
    const base = {
      name: "x",
      requireName: false,
      ...times,
      maxUploadsPerDevice: null,
    };
    expect(settingsSchema.safeParse({ ...base, pin: "12" }).success).toBe(
      false,
    );
    expect(settingsSchema.safeParse({ ...base, pin: "1234" }).success).toBe(
      true,
    );
    const at = (h: number) =>
      new Date(
        new Date(times.startsAt).getTime() + h * 3_600_000,
      ).toISOString();
    // Settings allow up to 48 hours (VIP); the action checks the plan.
    expect(settingsSchema.safeParse({ ...base, endsAt: at(48) }).success).toBe(
      true,
    );
    expect(settingsSchema.safeParse({ ...base, endsAt: at(49) }).success).toBe(
      false,
    );
  });
});

describe("getUploadState", () => {
  const now = new Date("2026-06-14T12:00:00Z");
  const base = {
    status: "active" as const,
    plan: "standard" as const,
    startsAt: null as Date | null,
    endsAt: null as Date | null,
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
  it("opens only during the event (#77)", () => {
    const during = {
      ...base,
      startsAt: new Date(now.getTime() - 3_600_000),
      endsAt: new Date(now.getTime() + 3_600_000),
    };
    expect(getUploadState(during, now)).toBe("open");
    expect(
      getUploadState(
        { ...during, startsAt: new Date(now.getTime() + 60_000) },
        now,
      ),
    ).toBe("not_open_yet");
    expect(getUploadState({ ...during, endsAt: now }, now)).toBe("closed");
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

describe("event times", () => {
  it("keeps a valid end and fixes an invalid one", () => {
    expect(adjustEnd("2026-06-14T19:00", "2026-06-14T23:30")).toBe(
      "2026-06-14T23:30",
    );
    expect(adjustEnd("2026-06-14T19:00", "2026-06-14T18:00")).toBe(
      "2026-06-15T00:00",
    );
    expect(adjustEnd("2026-06-14T19:00", "2026-06-16T19:00")).toBe(
      "2026-06-15T00:00",
    );
  });
  it("allows at most 24 hours", () => {
    expect(maxEnd("2026-06-14T19:00")).toBe("2026-06-15T19:00");
    expect(clampEnd("2026-06-14T19:00", "2026-06-15T23:00")).toBe(
      "2026-06-15T19:00",
    );
  });
  it("reads an end at or before the start as the next day", () => {
    // 19:00 → 00:00 is midnight after the party, not the morning before.
    expect(endAfter("2026-06-14T19:00", "2026-06-14T00:00")).toBe(
      "2026-06-15T00:00",
    );
    expect(endAfter("2026-06-14T19:00", "2026-06-14T19:00")).toBe(
      "2026-06-15T19:00",
    );
    expect(endAfter("2026-06-14T19:00", "2026-06-14T23:00")).toBe(
      "2026-06-14T23:00",
    );
    expect(clampEnd("2026-06-14T19:00", "2026-06-14T02:30")).toBe(
      "2026-06-15T02:30",
    );
    // Month end rolls over too.
    expect(clampEnd("2026-06-30T21:00", "2026-06-30T01:00")).toBe(
      "2026-07-01T01:00",
    );
  });
});
