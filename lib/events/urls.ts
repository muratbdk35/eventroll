import { publicEnv } from "@/lib/public-env";

/** The link (and QR payload) guests open. */
export function guestUrl(event: { slug: string; locale: string }): string {
  return `${publicEnv.appUrl}/${event.locale}/e/${event.slug}`;
}
