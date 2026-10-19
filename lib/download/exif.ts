/**
 * Minimal EXIF for JPEGs that have none (DECISIONS #56, #61).
 *
 * The Photos app files a picture under the date in its EXIF data and nothing
 * else. Camera photos carry one; pictures that went through WhatsApp, were
 * downloaded or screenshotted usually don't, and would land on the day the
 * host saves them. For those JPEGs only, the gallery save adds the moment the
 * guest uploaded it, so they land on the event day. The JPEG pulled out of a
 * RAW file gets the RAW's own date and rotation the same way. Files that
 * already have EXIF are left exactly as they are.
 */

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** "YYYY:MM:DD HH:MM:SS" and "+HH:MM" in this device's time zone. */
export function exifDate(d: Date): { date: string; offset: string } {
  const date = `${d.getFullYear()}:${pad(d.getMonth() + 1)}:${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  return {
    date,
    offset: `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`,
  };
}

export type ExifFields = {
  /** "YYYY:MM:DD HH:MM:SS", local time of the shot. */
  date?: string;
  /** "+HH:MM". */
  offset?: string;
  /** EXIF orientation, 1–8. */
  orientation?: number;
};

/** A minimal APP1 segment: IFD0 (orientation) → Exif IFD (date, offset). */
function app1(f: ExifFields): Uint8Array {
  const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0)).concat(0);
  const dateBytes = f.date ? ascii(f.date) : null;
  const offBytes = f.date && f.offset ? ascii(f.offset) : null;
  const orient =
    f.orientation && f.orientation >= 1 && f.orientation <= 8
      ? f.orientation
      : null;

  // TIFF (big-endian) layout, offsets from the "MM" header.
  const ifd0 = 8;
  const ifd0Entries = (orient ? 1 : 0) + (dateBytes ? 1 : 0);
  const exifIfd = ifd0 + 2 + 12 * ifd0Entries + 4;
  const exifEntries = (dateBytes ? 1 : 0) + (offBytes ? 1 : 0);
  let data = dateBytes ? exifIfd + 2 + 12 * exifEntries + 4 : exifIfd;
  const dateAt = data;
  data += dateBytes?.length ?? 0;
  const offAt = data;
  data += offBytes?.length ?? 0;

  const tiff = new DataView(new ArrayBuffer(data));
  const u8 = new Uint8Array(tiff.buffer);
  u8.set([0x4d, 0x4d], 0); // "MM"
  tiff.setUint16(2, 42);
  tiff.setUint32(4, ifd0);
  const entry = (
    at: number,
    tag: number,
    type: number,
    n: number,
    v: number,
    short = false,
  ) => {
    tiff.setUint16(at, tag);
    tiff.setUint16(at + 2, type);
    tiff.setUint32(at + 4, n);
    // A SHORT value sits left-aligned in the 4-byte field.
    if (short) tiff.setUint16(at + 8, v);
    else tiff.setUint32(at + 8, v);
  };

  // IFD0, tags ascending: Orientation, then the pointer to the Exif IFD.
  tiff.setUint16(ifd0, ifd0Entries);
  let at = ifd0 + 2;
  if (orient) {
    entry(at, 0x0112, 3, 1, orient, true);
    at += 12;
  }
  if (dateBytes) {
    entry(at, 0x8769, 4, 1, exifIfd);
    at += 12;
  }
  tiff.setUint32(at, 0);

  // Exif IFD: DateTimeOriginal, OffsetTimeOriginal.
  if (dateBytes) {
    tiff.setUint16(exifIfd, exifEntries);
    entry(exifIfd + 2, 0x9003, 2, dateBytes.length, dateAt);
    if (offBytes) entry(exifIfd + 14, 0x9011, 2, offBytes.length, offAt);
    tiff.setUint32(exifIfd + 2 + 12 * exifEntries, 0);
    u8.set(dateBytes, dateAt);
    if (offBytes) u8.set(offBytes, offAt);
  }

  const header = [0x45, 0x78, 0x69, 0x66, 0, 0]; // "Exif\0\0"
  const len = 2 + header.length + data;
  const out = new Uint8Array(2 + len);
  out.set([0xff, 0xe1, len >> 8, len & 0xff], 0);
  out.set(header, 4);
  out.set(u8, 4 + header.length);
  return out;
}

/** True when the JPEG already has an EXIF segment before the image data. */
export function hasExif(b: Uint8Array): boolean {
  let i = 2;
  while (i + 4 <= b.length && b[i] === 0xff) {
    const marker = b[i + 1];
    if (marker === 0xda || marker === 0xd9) break; // image data / end
    const len = (b[i + 2] << 8) | b[i + 3];
    if (
      marker === 0xe1 &&
      b[i + 4] === 0x45 &&
      b[i + 5] === 0x78 &&
      b[i + 6] === 0x69 &&
      b[i + 7] === 0x66
    ) {
      return true;
    }
    i += 2 + len;
  }
  return false;
}

/**
 * The JPEG with the given EXIF added, or null when nothing should change
 * (not a JPEG, it already has EXIF, or there is nothing to add).
 */
export function withExif(
  b: Uint8Array,
  f: ExifFields,
): Uint8Array<ArrayBuffer> | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  if (!f.date && !f.orientation) return null;
  if (hasExif(b)) return null;
  // After the JFIF APP0 segment if there is one, else right after SOI.
  let at = 2;
  if (b[2] === 0xff && b[3] === 0xe0) at = 4 + ((b[4] << 8) | b[5]);
  const seg = app1(f);
  const out = new Uint8Array(b.length + seg.length);
  out.set(b.subarray(0, at), 0);
  out.set(seg, at);
  out.set(b.subarray(at), at + seg.length);
  return out;
}

/** The gallery save: the upload moment as the capture date. */
export function withCaptureDate(
  b: Uint8Array,
  d: Date,
): Uint8Array<ArrayBuffer> | null {
  return withExif(b, exifDate(d));
}
