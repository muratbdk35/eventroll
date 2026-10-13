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
