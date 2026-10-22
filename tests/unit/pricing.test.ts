import { describe, expect, it } from "vitest";
import {
  amountFor,
  canSelfRefund,
  discounted,
  planFromOrders,
} from "@/lib/pricing";

describe("amountFor", () => {
  it("charges the full price for a first plan", () => {
    expect(amountFor(null, "mini")).toBe(1900);
    expect(amountFor(null, "vip")).toBe(4900);
  });
  it("charges only the difference for an upgrade", () => {
    expect(amountFor("standard", "vip")).toBe(2000);
    expect(amountFor("mini", "pro")).toBe(2000);
  });
  it("refuses the same plan or a downgrade", () => {
    expect(amountFor("pro", "pro")).toBeNull();
    expect(amountFor("vip", "mini")).toBeNull();
  });
});

describe("planFromOrders", () => {
  it("takes the highest paid plan", () => {
    expect(planFromOrders([])).toBeNull();
    expect(planFromOrders([{ plan: "standard" }, { plan: "vip" }])).toBe("vip");
    expect(planFromOrders([{ plan: "pro" }, { plan: "mini" }])).toBe("pro");
  });
});

describe("canSelfRefund", () => {
  const now = new Date("2026-06-20T12:00:00Z");
  it("allows a refund within 14 days while nothing was uploaded", () => {
    expect(
      canSelfRefund({
        firstPaidAt: new Date("2026-06-07T12:00:00Z"),
        photosEver: 0,
        now,
      }),
    ).toBe(true);
  });
  it("refuses once photos came in, after 14 days, or unpaid", () => {
    const paid = new Date("2026-06-15T12:00:00Z");
    expect(canSelfRefund({ firstPaidAt: paid, photosEver: 1, now })).toBe(
      false,
    );
    expect(
      canSelfRefund({
        firstPaidAt: new Date("2026-06-01T12:00:00Z"),
        photosEver: 0,
        now,
      }),
    ).toBe(false);
    expect(canSelfRefund({ firstPaidAt: null, photosEver: 0, now })).toBe(
      false,
    );
  });
});

describe("discounted (#79)", () => {
  it("takes the percentage off, rounded to the cent", () => {
    expect(discounted(2900, 50)).toBe(1450);
    expect(discounted(1900, 25)).toBe(1425);
    expect(discounted(4900, 0)).toBe(4900);
  });
  it("is free at 100% and under Stripe's minimum", () => {
    expect(discounted(2900, 100)).toBe(0);
    expect(discounted(1900, 99)).toBe(0);
  });
});
