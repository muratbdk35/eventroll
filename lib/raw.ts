import { exifDate, withExif } from "@/lib/download/exif";

/*
 * Camera RAW files (DECISIONS #61). Browsers can't show them and the
 * explicit-image check can't read them, but nearly every RAW carries a JPEG
 * the camera rendered itself (what its screen shows), often at full size.
 * The guest's browser pulls out the largest one and uploads that instead,
 * with the RAW's own date and rotation. No decoder, no library: TIFF tags
 * and JPEG markers are read directly.
 */

export const RAW_EXT = new Set([
  "dng",
  "cr2",
  "cr3",
  "nef",
  "nrw",
  "arw",
  "srf",
  "sr2",
  "raf",
  "orf",
  "rw2",
  "pef",
  "srw",
  "3fr",
  "iiq",
  "x3f",
  "raw",
]);

export function isRawFile(file: { name: string; type: string }) {
  return (
    RAW_EXT.has(file.name.split(".").pop()?.toLowerCase() ?? "") ||
    /x-adobe-dng|x-canon|x-nikon|x-sony|x-fuji|x-olympus|x-panasonic|x-raw/i.test(
      file.type,
    )
  );
}

/** Below this the embedded preview is a thumbnail, not a photo. */
export const MIN_PREVIEW_PIXELS = 1_500_000;
/** RAW files above this aren't read at all (memory on phones). */
export const MAX_RAW_BYTES = 200 * 1024 * 1024;

export type JpegSpan = {
  start: number;
  end: number;
  width: number;
  height: number;
};

const isSof = (m: number) =>
  m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc;

/**
 * Walks one JPEG starting at `s` (FF D8). Returns its extent and size, or
 * null when it isn't a baseline/progressive JPEG a browser can show (DNG raw
 * tiles are lossless JPEG) or it is cut off.
 */
function jpegAt(b: Uint8Array, s: number): JpegSpan | null {
  let i = s + 2;
  let width = 0;
  let height = 0;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) return null;
    let m = b[i + 1];
    while (m === 0xff && i + 2 < b.length) m = b[++i + 1]; // fill bytes
    if (m === 0xd9) return null; // ended before any image data
    const len = (b[i + 2] << 8) | b[i + 3];
    if (isSof(m)) {
      if (m !== 0xc0 && m !== 0xc1 && m !== 0xc2) return null; // lossless etc.
      height = (b[i + 5] << 8) | b[i + 6];
      width = (b[i + 7] << 8) | b[i + 8];
    }
    if (m === 0xda) {
      // Entropy-coded data: skip to the next real marker.
      let j = i + 2 + len;
      while (j + 1 < b.length) {
        if (b[j] === 0xff) {
          const n = b[j + 1];
          if (n === 0x00 || (n >= 0xd0 && n <= 0xd7) || n === 0xff) {
            j += n === 0xff ? 1 : 2;
            continue;
          }
          if (n === 0xd9) {
            return width && height
              ? { start: s, end: j + 2, width, height }
              : null;
          }
          break; // another segment (progressive JPEGs have several scans)
        }
        j++;
      }
      if (j + 1 >= b.length) return null;
      i = j;
      continue;
    }
    i += 2 + len;
  }
  return null;
}

/** Every displayable JPEG in the file, largest picture first. */
export function findJpegs(b: Uint8Array): JpegSpan[] {
  const out: JpegSpan[] = [];
  for (let p = 0; p + 3 < b.length; p++) {
    if (b[p] !== 0xff || b[p + 1] !== 0xd8 || b[p + 2] !== 0xff) continue;
    const j = jpegAt(b, p);
    if (j) {
      out.push(j);
      p = j.end - 1; // a JPEG's own EXIF thumbnail is inside it: skip
    }
  }
  return out.sort(
    (a, z) =>
      z.width * z.height - a.width * a.height ||
      z.end - z.start - (a.end - a.start),
  );
}

/**
 * Date and rotation from a TIFF-based RAW (DNG, CR2, NEF, ARW, ORF, RW2,
 * PEF…): IFD0 Orientation and DateTime, Exif IFD DateTimeOriginal and
 * OffsetTimeOriginal. Anything unreadable is simply left out.
 */
export function readRawMeta(b: Uint8Array): {
  date?: string;
  offset?: string;
  orientation?: number;
} {
  if (b.length < 16) return {};
  const le = b[0] === 0x49 && b[1] === 0x49;
  if (!le && !(b[0] === 0x4d && b[1] === 0x4d)) return {};
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const u16 = (o: number) => v.getUint16(o, le);
  const u32 = (o: number) => v.getUint32(o, le);
  const out: { date?: string; offset?: string; orientation?: number } = {};

  const ascii = (o: number, n: number) => {
    if (o < 0 || o + n > b.length) return undefined;
    let s = "";
    for (let k = 0; k < n && b[o + k] !== 0; k++)
      s += String.fromCharCode(b[o + k]);
    return s;
  };
  const readIfd = (off: number, visit: (tag: number, e: number) => void) => {
    if (off <= 0 || off + 2 > b.length) return;
    const n = u16(off);
    for (let k = 0; k < n && off + 2 + 12 * (k + 1) <= b.length; k++) {
      const e = off + 2 + 12 * k;
      visit(u16(e), e);
    }
  };

  let exifPtr = 0;
  let dateTime: string | undefined;
  readIfd(u32(4), (tag, e) => {
    if (tag === 0x0112) out.orientation = u16(e + 8);
    if (tag === 0x0132) dateTime = ascii(u32(e + 8), 20);
    if (tag === 0x8769) exifPtr = u32(e + 8);
  });
  readIfd(exifPtr, (tag, e) => {
    if (tag === 0x9003) out.date = ascii(u32(e + 8), 20);
    if (tag === 0x9011) {
      const n = u32(e + 4);
      out.offset = n <= 4 ? ascii(e + 8, n) : ascii(u32(e + 8), n);
    }
  });
  out.date ??= dateTime;
  if (out.date && !/^\d{4}:\d\d:\d\d \d\d:\d\d:\d\d$/.test(out.date)) {
    delete out.date;
  }
  if (out.offset && !/^[+-]\d\d:\d\d$/.test(out.offset)) delete out.offset;
  if (!out.orientation || out.orientation > 8) delete out.orientation;
  return out;
}

/**
 * Browser only: the RAW's own JPEG as an uploadable file, or null when it
 * has none big enough (the uploader then says RAW isn't supported).
 */
export async function rawToJpeg(file: File): Promise<File | null> {
  if (file.size > MAX_RAW_BYTES) return null;
  const b = new Uint8Array(await file.arrayBuffer());
  const meta = readRawMeta(b);
  for (const span of findJpegs(b).slice(0, 4)) {
    if (span.width * span.height < MIN_PREVIEW_PIXELS) break;
    const bytes = b.slice(span.start, span.end);
    try {
      // Make sure the browser can actually decode it.
      const bmp = await createImageBitmap(
        new Blob([bytes], { type: "image/jpeg" }),
      );
      bmp.close();
    } catch {
      continue;
    }
    const fallback = exifDate(new Date(file.lastModified));
    const dated =
      withExif(bytes, {
        date: meta.date ?? fallback.date,
        offset: meta.date ? meta.offset : fallback.offset,
        orientation: meta.orientation,
      }) ?? bytes;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([dated], name, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  }
  return null;
}
