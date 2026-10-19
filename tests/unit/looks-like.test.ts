import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { looksLike } from "@/lib/uploads";

const img = (f: "jpeg" | "png" | "webp" | "gif") =>
  sharp({ create: { width: 4, height: 4, channels: 3, background: "#123" } })
    [f]()
    .toBuffer()
    .then((b) => new Uint8Array(b.subarray(0, 32)));

describe("looksLike", () => {
  it("accepts real images of the declared type", async () => {
    expect(looksLike("image/jpeg", await img("jpeg"))).toBe(true);
    expect(looksLike("image/png", await img("png"))).toBe(true);
    expect(looksLike("image/webp", await img("webp"))).toBe(true);
    expect(looksLike("image/gif", await img("gif"))).toBe(true);
    const heic = new Uint8Array(32);
    heic.set([0, 0, 0, 0x18, ...Buffer.from("ftypheic")], 0);
    expect(looksLike("image/heic", heic)).toBe(true);
  });

  it("refuses a mismatch or something that isn't a photo", async () => {
    expect(looksLike("image/jpeg", await img("png"))).toBe(false);
    const html = new TextEncoder().encode("<!doctype html><script>x</script>");
    expect(looksLike("image/jpeg", html)).toBe(false);
    expect(looksLike("image/heic", html)).toBe(false);
    const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0]);
    expect(looksLike("image/gif", exe)).toBe(false);
  });
});
