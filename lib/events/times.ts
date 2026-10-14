import { MAX_EVENT_HOURS } from "./schemas";

const pad = (n: number) => String(n).padStart(2, "0");
const HOUR = 3_600_000;

/** Date -> local "YYYY-MM-DDTHH:mm" (the value format of the date-time field). */
export function toLocalValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Latest allowed end for a start (start + MAX_EVENT_HOURS). */
export function maxEnd(start: string): string {
  return toLocalValue(
    new Date(new Date(start).getTime() + MAX_EVENT_HOURS * HOUR),
  );
}

/** When the start moves, keep the end valid: after the start, within 24 hours. */
export function adjustEnd(start: string, end: string): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (e > s && e - s <= MAX_EVENT_HOURS * HOUR) return end;
  return toLocalValue(new Date(s + 5 * HOUR));
}

/** Picking a later end than allowed snaps it to start + 24 hours. */
export function clampEnd(start: string, end: string): string {
  const latest = maxEnd(start);
  return end > latest ? latest : end;
}
