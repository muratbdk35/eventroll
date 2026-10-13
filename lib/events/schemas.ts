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

/** Longest event we accept (a festival weekend fits, a misplaced year doesn't). */
export const MAX_EVENT_DAYS = 14;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoDateTime = z.iso.datetime();

/** Start/end of the event. `eventDate` is the start's local calendar date. */
const timesShape = {
  startsAt: isoDateTime,
  endsAt: isoDateTime,
  eventDate: isoDate,
};

function validTimes(v: { startsAt: string; endsAt: string }): boolean {
  const start = new Date(v.startsAt).getTime();
  const end = new Date(v.endsAt).getTime();
  return end > start && end - start <= MAX_EVENT_DAYS * 86_400_000;
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
    uploadOpensAt: isoDateTime.nullable(),
    uploadClosesAt: isoDateTime.nullable(),
    maxUploadsPerDevice: z.number().int().min(1).max(5000).nullable(),
  })
  .refine(validTimes, timesError)
  .refine(
    (v) =>
      !v.uploadOpensAt ||
      !v.uploadClosesAt ||
      new Date(v.uploadOpensAt) < new Date(v.uploadClosesAt),
    { path: ["uploadClosesAt"], message: "closes before it opens" },
  );

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
