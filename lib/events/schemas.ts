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

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoDateTime = z.iso.datetime();

export const createEventSchema = z.object({
  name: z.string().trim().min(1).max(80),
  eventDate: isoDate,
  type: z.enum(EVENT_TYPES),
});

export const settingsSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    requireName: z.boolean(),
    /** undefined = keep, null = remove, string = set */
    pin: z.union([z.string().regex(/^\d{4,8}$/), z.null()]).optional(),
    uploadOpensAt: isoDateTime.nullable(),
    uploadClosesAt: isoDateTime.nullable(),
    maxUploadsPerDevice: z.number().int().min(1).max(5000).nullable(),
  })
  .refine(
    (v) =>
      !v.uploadOpensAt ||
      !v.uploadClosesAt ||
      new Date(v.uploadOpensAt) < new Date(v.uploadClosesAt),
    { path: ["uploadClosesAt"], message: "closes before it opens" },
  );

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
