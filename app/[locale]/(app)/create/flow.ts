import type { TicketColor } from "@/lib/events/ticket";
import type { PlanId } from "@/lib/plans";

// Shared by the server page and the client steps (a "use client" module would
// hand the server a client reference instead of these values).

export const STEPS = ["details", "plan", "account", "pay", "review"] as const;
export type FlowStep = (typeof STEPS)[number];

export type FlowEvent = {
  id: string;
  name: string;
  type: string;
  startsAt: string | null;
  endsAt: string | null;
  requireName: boolean;
  hasPin: boolean;
  uploadOpensAt: string | null;
  uploadClosesAt: string | null;
  maxUploadsPerDevice: number | null;
  plan: PlanId | null;
  ticketColor: TicketColor;
};

export type FlowProps = {
  step: FlowStep;
  plan: PlanId | null;
  signedIn: boolean;
  userEmail: string | null;
  googleEnabled: boolean;
  devLogin: boolean;
  devPay: boolean;
  event: FlowEvent | null;
};

/** Builds a /create URL keeping the plan and event along. */
export function flowHref(
  step: FlowStep,
  { plan, event }: { plan?: PlanId | null; event?: string | null },
) {
  const q = new URLSearchParams({ step });
  if (plan) q.set("plan", plan);
  if (event) q.set("event", event);
  return `/create?${q}`;
}
