import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptIp, encryptIp } from "@/lib/guest/ip";

const key = randomBytes(32).toString("base64");

describe("uploader IP encryption", () => {
  it("round-trips IPv4 and IPv6", () => {
    for (const ip of ["203.0.113.7", "2001:db8::1"]) {
      const blob = encryptIp(ip, key)!;
      expect(blob).toMatch(/^v1:/);
      expect(blob).not.toContain(ip);
      expect(decryptIp(blob, key)).toBe(ip);
    }
  });

  it("uses a fresh nonce every time", () => {
    expect(encryptIp("203.0.113.7", key)).not.toBe(
      encryptIp("203.0.113.7", key),
    );
  });

  it("stores nothing without a valid key", () => {
    expect(encryptIp("203.0.113.7", undefined)).toBeNull();
    expect(encryptIp("203.0.113.7", "too-short")).toBeNull();
  });

  it("refuses a wrong key or tampered data", () => {
    const blob = encryptIp("203.0.113.7", key)!;
    expect(decryptIp(blob, randomBytes(32).toString("base64"))).toBeNull();
    const tampered = blob.slice(0, -2) + (blob.endsWith("A") ? "B" : "A");
    expect(decryptIp(tampered, key)).toBeNull();
  });
});
