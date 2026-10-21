import { z } from "zod";

export const EVENT_TYPES = [
  "wedding",
  "birthday",
  "corporate",
  "baby_shower",
  "graduation",
  "party",
  "other",
] as const;

/** Longest event on any plan but VIP (owner decision: one day, #77). */
export const MAX_EVENT_HOURS = 24;
/** VIP events may run two days; the settings action checks the plan. */
export const MAX_EVENT_HOURS_ANY = 48;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoDateTime = z.iso.datetime();

/** Start/end of the event. `eventDate` is the start's local calendar date. */
const timesShape = {
  startsAt: isoDateTime,
  endsAt: isoDateTime,
  eventDate: isoDate,
};

export function eventHours(v: { startsAt: string; endsAt: string }): number {
  return (
    (new Date(v.endsAt).getTime() - new Date(v.startsAt).getTime()) / 3_600_000
  );
}

function validTimes(v: { startsAt: string; endsAt: string }): boolean {
  const h = eventHours(v);
  return h > 0 && h <= MAX_EVENT_HOURS;
}

function validTimesAny(v: { startsAt: string; endsAt: string }): boolean {
  const h = eventHours(v);
  return h > 0 && h <= MAX_EVENT_HOURS_ANY;
}

const timesError = { path: ["endsAt"], message: "invalid range" };

export const createEventSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    type: z.enum(EVENT_TYPES),
    ...timesShape,
  })
  .refine(validTimes, timesError);

export const settingsSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    requireName: z.boolean(),
    ...timesShape,
    /** undefined = keep, null = remove, string = set */
    pin: z.union([z.string().regex(/^\d{4,8}$/), z.null()]).optional(),
    maxUploadsPerDevice: z.number().int().min(1).max(5000).nullable(),
  })
  .refine(validTimesAny, timesError);

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
