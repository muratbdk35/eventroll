/** Photos only (DECISIONS #19). */
export const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
] as const;

export type AllowedMime = (typeof ALLOWED_MIME)[number];

const EXT: Record<AllowedMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/gif": "gif",
};

/** Per-file cap. Phone photos are 3–6 MB; large exports can reach 40+. */
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_THUMB_BYTES = 2 * 1024 * 1024;

export function isAllowedMime(mime: string): mime is AllowedMime {
  return (ALLOWED_MIME as readonly string[]).includes(mime);
}

/**
 * Whether a file's first bytes match the photo type the guest declared, so
 * nothing but real images is ever kept (a renamed HTML page or program is
 * refused at confirm). JPEG, PNG, WebP, GIF, and HEIC/HEIF by their ISO
 * BMFF brand.
 */
export function looksLike(mime: AllowedMime, b: Uint8Array): boolean {
  const ascii = (from: number, to: number) =>
    String.fromCharCode(...b.subarray(from, to));
  switch (mime) {
    case "image/jpeg":
      return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "image/png":
      return b[0] === 0x89 && ascii(1, 4) === "PNG";
    case "image/gif":
      return ascii(0, 4) === "GIF8";
    case "image/webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "image/heic":
    case "image/heif":
      return (
        ascii(4, 8) === "ftyp" &&
        /^(heic|heix|hevc|hevx|heim|heis|mif1|msf1|avif)$/.test(ascii(8, 12))
      );
  }
}

export function extFor(mime: AllowedMime): string {
  return EXT[mime];
}

export function originalKey(
  eventId: string,
  mediaId: string,
  mime: AllowedMime,
) {
  return `events/${eventId}/${mediaId}/original.${extFor(mime)}`;
}

export function thumbKey(eventId: string, mediaId: string) {
  return `events/${eventId}/${mediaId}/thumb.jpg`;
}
