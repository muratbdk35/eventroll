/**
 * A local image (e.g. /marketing/toast.jpg) through Next's image optimizer, for
 * the places that render a plain <img> (PhotoStack and PhotoGrid take signed
 * storage URLs, so they can't use next/image). `width` must be one of the
 * configured image sizes; quality 75 is the only one allowed (Next 16).
 */
export function optimized(src: string, width: 256 | 384 | 640 | 1080 = 384) {
  if (!src.startsWith("/")) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}
