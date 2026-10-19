import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { withExif } from "@/lib/download/exif";
import { findJpegs, isRawFile, readRawMeta } from "@/lib/raw";

const jpeg = (w: number, h: number) =>
  sharp({ create: { width: w, height: h, channels: 3, background: "#3a7" } })
    .jpeg()
    .toBuffer();

/** A TIFF-style RAW: IFD0 (Orientation, DateTime, Exif pointer) + Exif IFD. */
function tiffHeader(le: boolean) {
  const v = new DataView(new ArrayBuffer(200));
  const u8 = new Uint8Array(v.buffer);
  u8.set(le ? [0x49, 0x49] : [0x4d, 0x4d], 0);
  v.setUint16(2, 42, le);
  v.setUint32(4, 8, le);
  const entry = (
    at: number,
    tag: number,
    type: number,
    n: number,
    val: number,
    short = false,
  ) => {
    v.setUint16(at, tag, le);
    v.setUint16(at + 2, type, le);
    v.setUint32(at + 4, n, le);
    if (short) v.setUint16(at + 8, val, le);
    else v.setUint32(at + 8, val, le);
  };
  v.setUint16(8, 3, le);
  entry(10, 0x0112, 3, 1, 6, true); // rotated 90° CW
  entry(22, 0x0132, 2, 20, 120); // DateTime (fallback)
  entry(34, 0x8769, 4, 1, 60);
  v.setUint32(46, 0, le);
  v.setUint16(60, 2, le);
  entry(62, 0x9003, 2, 20, 140);
  entry(74, 0x9011, 2, 7, 160);
  v.setUint32(86, 0, le);
  const put = (at: number, s: string) =>
    u8.set([...s].map((c) => c.charCodeAt(0)).concat(0), at);
  put(120, "2026:06:01 10:00:00");
  put(140, "2026:06:14 21:30:05");
  put(160, "+02:00");
  return u8;
}

async function fakeRaw(le = true) {
  const small = await jpeg(160, 120);
  const big = await jpeg(1600, 1200);
  const junk = new Uint8Array(5000).fill(0x42);
  const parts = [tiffHeader(le), junk, small, junk, big, junk];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return { raw: out, big };
}

describe("RAW files", () => {
  it("recognises RAW by extension or type", () => {
    expect(isRawFile({ name: "IMG_0001.DNG", type: "" })).toBe(true);
    expect(isRawFile({ name: "x.cr3", type: "" })).toBe(true);
    expect(isRawFile({ name: "x", type: "image/x-adobe-dng" })).toBe(true);
    expect(isRawFile({ name: "x.jpg", type: "image/jpeg" })).toBe(false);
  });

  it("finds the embedded JPEGs, largest first, byte for byte", async () => {
    const { raw, big } = await fakeRaw();
    const found = findJpegs(raw);
    expect(found.map((j) => [j.width, j.height])).toEqual([
      [1600, 1200],
      [160, 120],
    ]);
    expect(
      Buffer.from(raw.subarray(found[0].start, found[0].end)).equals(big),
    ).toBe(true);
  });

  it("ignores a JPEG that is cut off", async () => {
    const big = await jpeg(800, 600);
    expect(findJpegs(big.subarray(0, big.length - 100))).toEqual([]);
  });

  it("reads date, offset and rotation, either byte order", () => {
    for (const le of [true, false]) {
      expect(readRawMeta(tiffHeader(le))).toEqual({
        date: "2026:06:14 21:30:05",
        offset: "+02:00",
        orientation: 6,
      });
    }
    expect(readRawMeta(new Uint8Array(64))).toEqual({});
  });

  it("writes the RAW's date and rotation into the extracted JPEG", async () => {
    const { raw } = await fakeRaw(false);
    const span = findJpegs(raw)[0];
    const out = withExif(raw.slice(span.start, span.end), readRawMeta(raw))!;
    const meta = await sharp(Buffer.from(out)).metadata();
    expect(meta.orientation).toBe(6);
    expect(meta.width).toBe(1600);
    expect(meta.exif?.toString("latin1")).toContain("2026:06:14 21:30:05");
  });
});
