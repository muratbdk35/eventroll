/*
 * Which host email is due for an event (DECISIONS #54). Pure, so it can be
 * tested; the sending lives in lib/email/host-notices.ts.
 */

export const DAY = 86_400_000;

export type NoticeKind = "albumReady" | "reminder3" | "reminder1";

/** What is due now for one event, if anything. */
export function noticeDue(
  e: {
    expiresAt: Date;
    albumReadyMailAt: Date | null;
    reminder3MailAt: Date | null;
    reminder1MailAt: Date | null;
  },
  now: Date,
): NoticeKind | null {
  const left = e.expiresAt.getTime() - now.getTime();
  if (left <= 0) return null;
  if (left <= DAY) return e.reminder1MailAt ? null : "reminder1";
  if (!e.albumReadyMailAt) return "albumReady";
  if (left <= 3 * DAY && !e.reminder3MailAt) return "reminder3";
  return null;
}

/** Whether the download window is over (the photos are or will be deleted). */
export function pastWindow(expiresAt: Date, now: Date = new Date()) {
  return expiresAt.getTime() <= now.getTime();
}
