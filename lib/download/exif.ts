/**
 * The Photos app files a picture under the date in its EXIF data and nothing
 * else. Camera photos carry one; pictures that went through WhatsApp, were
 * downloaded or screenshotted usually don't, and would land on the day the
 * host saves them. For those JPEGs only, the gallery save adds the moment the
 * guest uploaded it, so they land on the event day (DECISIONS #56). Files
 * that already have EXIF are left exactly as they are.
 */

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** "YYYY:MM:DD HH:MM:SS" and "+HH:MM" in the saving phone's time zone. */
function exifDate(d: Date): [string, string] {
  const date = `${d.getFullYear()}:${pad(d.getMonth() + 1)}:${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  return [date, `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`];
}

/** A minimal APP1 segment: IFD0 → Exif IFD with DateTimeOriginal (+ offset). */
function app1(d: Date): Uint8Array {
  const [date, offset] = exifDate(d);
  const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0)).concat(0);
  const dateBytes = ascii(date); // 20
  const offBytes = ascii(offset); // 7

  // TIFF (big-endian) offsets, from the "MM" header.
  const ifd0 = 8;
  const exifIfd = ifd0 + 2 + 12 + 4; // 26
  const dateAt = exifIfd + 2 + 2 * 12 + 4; // 56
  const offAt = dateAt + dateBytes.length; // 76
  const tiffLen = offAt + offBytes.length; // 83

  const tiff = new DataView(new ArrayBuffer(tiffLen));
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
  ) => {
    tiff.setUint16(at, tag);
    tiff.setUint16(at + 2, type);
    tiff.setUint32(at + 4, n);
    tiff.setUint32(at + 8, v);
  };
  // IFD0: one entry, the pointer to the Exif IFD.
  tiff.setUint16(ifd0, 1);
  entry(ifd0 + 2, 0x8769, 4, 1, exifIfd);
  tiff.setUint32(ifd0 + 14, 0);
  // Exif IFD: DateTimeOriginal, OffsetTimeOriginal (ascending tags).
  tiff.setUint16(exifIfd, 2);
  entry(exifIfd + 2, 0x9003, 2, dateBytes.length, dateAt);
  entry(exifIfd + 14, 0x9011, 2, offBytes.length, offAt);
  tiff.setUint32(exifIfd + 26, 0);
  u8.set(dateBytes, dateAt);
  u8.set(offBytes, offAt);

  const header = [0x45, 0x78, 0x69, 0x66, 0, 0]; // "Exif\0\0"
  const len = 2 + header.length + tiffLen;
  const out = new Uint8Array(2 + len);
  out.set([0xff, 0xe1, len >> 8, len & 0xff], 0);
  out.set(header, 4);
  out.set(u8, 4 + header.length);
  return out;
}

/** True when the JPEG already has an EXIF segment before the image data. */
function hasExif(b: Uint8Array): boolean {
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
 * The JPEG with a capture date added, or null when nothing should change
 * (not a JPEG, or it already has EXIF).
 */
export function withCaptureDate(
  b: Uint8Array,
  d: Date,
): Uint8Array<ArrayBuffer> | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  if (hasExif(b)) return null;
  // After the JFIF APP0 segment if there is one, else right after SOI.
  let at = 2;
  if (b[2] === 0xff && b[3] === 0xe0) at = 4 + ((b[4] << 8) | b[5]);
  const seg = app1(d);
  const out = new Uint8Array(b.length + seg.length);
  out.set(b.subarray(0, at), 0);
  out.set(seg, at);
  out.set(b.subarray(at), at + seg.length);
  return out;
}
