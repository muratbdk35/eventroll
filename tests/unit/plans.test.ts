import { describe, expect, it } from "vitest";
import {
  computeExpiresAt,
  computeExpiresAtFromEnd,
  DOWNLOAD_WINDOW_DAYS,
  plans,
} from "@/lib/plans";

describe("plans", () => {
  it("has the owner-approved prices", () => {
    expect(plans.standard.priceUsd).toBe(29);
    expect(plans.premium.priceUsd).toBe(49);
  });

  it("premium is strictly larger than standard", () => {
    expect(plans.premium.maxItems).toBeGreaterThan(plans.standard.maxItems);
    expect(plans.premium.maxBytes).toBeGreaterThan(plans.standard.maxBytes);
  });
});

describe("computeExpiresAt", () => {
  it("keeps media until the end of the download window after the event", () => {
    expect(DOWNLOAD_WINDOW_DAYS).toBe(7);
    expect(computeExpiresAt("2026-06-14").toISOString()).toBe(
      "2026-06-21T23:59:59.999Z",
    );
  });

  it("handles month and year boundaries", () => {
    expect(computeExpiresAt("2026-12-28").toISOString()).toBe(
      "2027-01-04T23:59:59.999Z",
    );
  });
});

describe("computeExpiresAtFromEnd", () => {
  it("counts the download window from the day the event ends", () => {
    expect(
      computeExpiresAtFromEnd(new Date("2026-06-15T01:30:00Z")).toISOString(),
    ).toBe("2026-06-22T23:59:59.999Z");
  });
  it("keeps print templates for Premium", () => {
    expect(plans.premium.printTemplates).toBe(true);
    expect(plans.standard.printTemplates).toBe(false);
  });
});
