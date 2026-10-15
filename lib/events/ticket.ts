import type { CSSProperties } from "react";

/**
 * Ticket colours (DECISIONS #42). Every plan can pick one; the ticket's design
 * stays exactly as adapted (warp texture, year watermark). Each palette keeps
 * the original's structure: a mid-tone base, a pale dither, dark ink that
 * reads at 4.5:1 or better on the base, and a pale watermark.
 */

export const TICKET_COLORS = {
  powder: {
    back: "#6f95bd",
    front: "#d7e4f2",
    ink: "#10223a",
    watermark: "#eef4fb",
  },
  sage: {
    back: "#86a37f",
    front: "#e0ead9",
    ink: "#15241a",
    watermark: "#f1f6ee",
  },
  blush: {
    back: "#c98b98",
    front: "#f3dde2",
    ink: "#2f121a",
    watermark: "#fbf0f2",
  },
  terracotta: {
    back: "#cf8560",
    front: "#f6dccd",
    ink: "#2e1408",
    watermark: "#fcefe7",
  },
  sand: {
    back: "#c4ad86",
    front: "#f0e6d3",
    ink: "#2a2112",
    watermark: "#faf5ec",
  },
  lavender: {
    back: "#9a90c4",
    front: "#e3def3",
    ink: "#191433",
    watermark: "#f4f1fb",
  },
} as const;

export type TicketColor = keyof typeof TICKET_COLORS;

export const ticketColors = Object.keys(TICKET_COLORS) as TicketColor[];

export const DEFAULT_TICKET_COLOR: TicketColor = "powder";

export function isTicketColor(v: unknown): v is TicketColor {
  return typeof v === "string" && v in TICKET_COLORS;
}

/** The stored colour, or the default when unset or unknown. */
export function ticketColor(v: unknown): TicketColor {
  return isTicketColor(v) ? v : DEFAULT_TICKET_COLOR;
}

/**
 * The guest page takes the ticket's colour as its theme (DECISIONS #48):
 * `primary` drives buttons, progress, focus rings and the Halo glows (white
 * text on it reads at 4.5:1 or better), `ground` is the page background.
 * Powder blue matches the app's own theme.
 */
export const TICKET_THEMES: Record<
  TicketColor,
  { primary: string; ground: string }
> = {
  powder: { primary: "#457094", ground: "#eef3f9" },
  sage: { primary: "#4e6b48", ground: "#f1f5ee" },
  blush: { primary: "#9a4a5b", ground: "#fbf1f3" },
  terracotta: { primary: "#a34b26", ground: "#fcf2ec" },
  sand: { primary: "#7d6235", ground: "#faf6ee" },
  lavender: { primary: "#5d5296", ground: "#f4f2fb" },
};

/** CSS variables that re-theme everything under the guest page's root. */
export function ticketThemeStyle(color: TicketColor): CSSProperties {
  const { primary, ground } = TICKET_THEMES[color];
  return {
    "--primary": primary,
    "--ring": `color-mix(in oklch, ${primary}, white 25%)`,
    "--accent": `color-mix(in oklch, ${primary}, white 87%)`,
    "--accent-foreground": `color-mix(in oklch, ${primary}, black 45%)`,
    "--secondary": `color-mix(in oklch, ${primary}, white 90%)`,
    "--guest-ground": ground,
    backgroundColor: ground,
  } as CSSProperties;
}

/** Confetti for a finished upload, in the ticket's colours. */
export function ticketConfetti(color: TicketColor): string[] {
  const c = TICKET_COLORS[color];
  return [
    TICKET_THEMES[color].primary,
    c.back,
    c.front,
    c.watermark,
    "#ffffff",
  ];
}
