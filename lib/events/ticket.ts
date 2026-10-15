/**
 * Ticket styles (DECISIONS #42). Every plan gets the ticket in powder blue
 * with the plain pattern; choosing another colour or pattern is Premium.
 * Ink colours read at 4.5:1 or better on the base colour.
 */

export const TICKET_COLORS = {
  powder: { back: "#4d7399", front: "#6b90b6", ink: "#f4f8fc" },
  midnight: { back: "#1f2a44", front: "#33456b", ink: "#f3e9d6" },
  sage: { back: "#4f6b4c", front: "#6d8a69", ink: "#f2f5ec" },
  blush: { back: "#9c4f60", front: "#bd6e7f", ink: "#fff3f5" },
  terracotta: { back: "#a24a28", front: "#c4693f", ink: "#fff4ec" },
  sand: { back: "#c9b48a", front: "#ddcca8", ink: "#2b2214" },
} as const;

export const TICKET_PATTERNS = {
  plain: { shape: "simplex", type: "4x4", size: 2 },
  dots: { shape: "dots", type: "4x4", size: 2.5 },
  wave: { shape: "wave", type: "8x8", size: 2 },
  swirl: { shape: "swirl", type: "random", size: 1.5 },
} as const;

export type TicketColor = keyof typeof TICKET_COLORS;
export type TicketPattern = keyof typeof TICKET_PATTERNS;

export const ticketColors = Object.keys(TICKET_COLORS) as TicketColor[];
export const ticketPatterns = Object.keys(TICKET_PATTERNS) as TicketPattern[];

export const DEFAULT_TICKET = { color: "powder", pattern: "plain" } as const;

export function isTicketColor(v: unknown): v is TicketColor {
  return typeof v === "string" && v in TICKET_COLORS;
}
export function isTicketPattern(v: unknown): v is TicketPattern {
  return typeof v === "string" && v in TICKET_PATTERNS;
}

/**
 * The style a guest sees: the host's choice when the plan allows it,
 * otherwise the default.
 */
export function ticketStyle(event: {
  ticketColor: string | null;
  ticketPattern: string | null;
  allowed: boolean;
}): { color: TicketColor; pattern: TicketPattern } {
  if (!event.allowed) return DEFAULT_TICKET;
  return {
    color: isTicketColor(event.ticketColor)
      ? event.ticketColor
      : DEFAULT_TICKET.color,
    pattern: isTicketPattern(event.ticketPattern)
      ? event.ticketPattern
      : DEFAULT_TICKET.pattern,
  };
}
