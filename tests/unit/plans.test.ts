import { describe, expect, it } from "vitest";
import {
  computeExpiresAt,
  computeExpiresAtFromEnd,
  DEFAULT_PLAN,
  MIN_RETENTION_DAYS,
  nextPlan,
  planOrder,
  plans,
} from "@/lib/plans";

describe("plans", () => {
  it("has the owner-approved prices", () => {
    expect(planOrder.map((id) => plans[id].priceUsd)).toEqual([19, 29, 39, 49]);
  });

  it("every tier is strictly larger than the one below", () => {
    for (let i = 1; i < planOrder.length; i++) {
      const [lo, hi] = [plans[planOrder[i - 1]], plans[planOrder[i]]];
      expect(hi.maxItems).toBeGreaterThan(lo.maxItems);
      expect(hi.maxBytes).toBeGreaterThan(lo.maxBytes);
      expect(hi.retentionDays).toBeGreaterThan(lo.retentionDays);
    }
  });

  it("keeps print templates for Pro and VIP", () => {
    expect(planOrder.filter((id) => plans[id].printTemplates)).toEqual([
      "pro",
      "vip",
    ]);
  });

  it("starts the slider on Standard and steps up one tier", () => {
    expect(DEFAULT_PLAN).toBe("standard");
    expect(nextPlan("mini")).toBe("standard");
    expect(nextPlan("vip")).toBeNull();
  });
});

describe("computeExpiresAt", () => {
  it("keeps media until the end of the shortest window before a plan", () => {
    expect(MIN_RETENTION_DAYS).toBe(7);
    expect(computeExpiresAt("2026-06-14").toISOString()).toBe(
      "2026-06-21T23:59:59.999Z",
    );
  });

  it("uses the plan's own window", () => {
    expect(computeExpiresAt("2026-06-14", "vip").toISOString()).toBe(
      "2026-07-14T23:59:59.999Z",
    );
  });

  it("handles month and year boundaries", () => {
    expect(computeExpiresAt("2026-12-28").toISOString()).toBe(
      "2027-01-04T23:59:59.999Z",
    );
  });
});

describe("computeExpiresAtFromEnd", () => {
  it("counts the window from the day the event ends", () => {
    expect(
      computeExpiresAtFromEnd(new Date("2026-06-15T01:30:00Z")).toISOString(),
    ).toBe("2026-06-22T23:59:59.999Z");
    expect(
      computeExpiresAtFromEnd(
        new Date("2026-06-15T01:30:00Z"),
        "pro",
      ).toISOString(),
    ).toBe("2026-07-06T23:59:59.999Z");
  });
});
