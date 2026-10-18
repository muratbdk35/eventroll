import type { PlanId } from "@/lib/plans";

export type UploadState =
  "open" | "needs_plan" | "not_open_yet" | "closed" | "expired" | "unavailable";

type EventForState = {
  status: "draft" | "active" | "expired" | "deleted" | "suspended";
  plan: PlanId | null;
  uploadOpensAt: Date | null;
  uploadClosesAt: Date | null;
  expiresAt: Date;
};

/** Single decision point for "can guests upload to this event right now?" */
export function getUploadState(
  event: EventForState,
  now: Date = new Date(),
): UploadState {
  if (event.status === "deleted" || event.status === "suspended") {
    return "unavailable";
  }
  if (event.status === "expired" || event.expiresAt <= now) return "expired";
  if (!event.plan || event.status === "draft") return "needs_plan";
  if (event.uploadOpensAt && now < event.uploadOpensAt) return "not_open_yet";
  if (event.uploadClosesAt && now >= event.uploadClosesAt) return "closed";
  return "open";
}
