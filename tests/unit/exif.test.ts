import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { withCaptureDate } from "@/lib/download/exif";

const jpeg = (opts: { exif?: boolean } = {}) => {
  let img = sharp({
    create: { width: 8, height: 8, channels: 3, background: "#c33" },
  }).jpeg();
  if (opts.exif) {
    img = img.withExif({ IFD0: { Make: "Apple", Model: "iPhone 15" } });
  }
  return img.toBuffer();
};

describe("withCaptureDate", () => {
  it("adds a date to a JPEG without EXIF, and it still decodes", async () => {
    const src = new Uint8Array(await jpeg());
    const out = withCaptureDate(src, new Date(2026, 5, 14, 21, 30, 5));
    expect(out).not.toBeNull();
    const meta = await sharp(Buffer.from(out!)).metadata();
    expect(meta.width).toBe(8);
    expect(meta.exif?.toString("latin1")).toContain("2026:06:14 21:30:05");
  });

  it("leaves photos that already have EXIF alone", async () => {
    const src = new Uint8Array(await jpeg({ exif: true }));
    expect(withCaptureDate(src, new Date())).toBeNull();
  });

  it("ignores anything that isn't a JPEG", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]);
    expect(withCaptureDate(png, new Date())).toBeNull();
  });
});
