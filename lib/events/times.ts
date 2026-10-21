import { MAX_EVENT_HOURS } from "./schemas";

const pad = (n: number) => String(n).padStart(2, "0");
const HOUR = 3_600_000;

/** Date -> local "YYYY-MM-DDTHH:mm" (the value format of the date-time field). */
export function toLocalValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Latest allowed end for a start (24 hours, 48 on VIP). */
export function maxEnd(start: string, hours = MAX_EVENT_HOURS): string {
  return toLocalValue(new Date(new Date(start).getTime() + hours * HOUR));
}

/** When the start moves, keep the end valid: after the start, within 24 hours. */
export function adjustEnd(
  start: string,
  end: string,
  hours = MAX_EVENT_HOURS,
): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (e > s && e - s <= hours * HOUR) return end;
  return toLocalValue(new Date(s + 5 * HOUR));
}

/**
 * An end at or before the start means the next day: 19:00 → 00:00 ends at
 * midnight after the party, not the morning before it.
 */
export function endAfter(start: string, end: string): string {
  if (!start || !end) return end;
  const s = new Date(start).getTime();
  const e = new Date(end);
  while (e.getTime() <= s) e.setDate(e.getDate() + 1);
  return toLocalValue(e);
}

/**
 * The end the host picked, rolled past the start if needed (`endAfter`) and
 * capped at start + 24 hours.
 */
export function clampEnd(
  start: string,
  end: string,
  hours = MAX_EVENT_HOURS,
): string {
  const latest = maxEnd(start, hours);
  const next = endAfter(start, end);
  return next > latest ? latest : next;
}
