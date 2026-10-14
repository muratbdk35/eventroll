"use client";

// Shared chrome for the Halo controls, adapted from cult/ui "Halo" (MIT,
// https://github.com/nolly-studio/cult-ui). Changes by eventroll: the
// magenta/violet/cyan ramp became our powder-blue ramp, and the
// drifting blobs only move while the control is active (hover/focus) instead
// of looping forever, because a page full of looping blurs lags on phones.
// No backdrop-filter: our grounds are flat, so it cost frames for nothing.

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export const haloRamp = {
  primary: "linear-gradient(90deg, #6b95c6, #7f93c9, #a9c6e6, #4f7cad)",
  secondary: "linear-gradient(90deg, #a4b4de, #b9cdea, #6b95c6)",
  tertiary: "linear-gradient(90deg, #86a9d2, #c3cdea, #3f6a99)",
};

/** The original's green "success" rim (notifications). */
export const haloSuccessRamp = {
  primary:
    "linear-gradient(90deg, #047857, #059669, #10b981, #14b8a6, #0d9488)",
  secondary: "linear-gradient(90deg, #34d399, #6ee7b7, #2dd4bf, #5eead4)",
  tertiary: "linear-gradient(90deg, #065f46, #047857, #0f766e)",
};

export type HaloRamp = typeof haloRamp;

/** Soft warm light from below and above, behind a frosted surface. */
export const haloUnderglow = [
  "radial-gradient(90% 70% at 50% 100%, rgba(84,125,175,0.26), rgba(150,165,220,0.1) 48%, transparent 62%)",
  "radial-gradient(70% 55% at 30% 0%, rgba(170,198,232,0.24), rgba(105,145,195,0.08) 45%, transparent 58%)",
];

/** Rim colour: the border tinted towards pale blue. */
export const haloRim =
  "border-[color-mix(in_oklch,var(--border)_70%,oklch(0.86_0.039_242))]";

/** Frosted fill that lets the glow read through. */
export function haloFill(translucent: boolean, emphasis = false) {
  if (translucent) {
    return emphasis
      ? "linear-gradient(to bottom, color-mix(in oklch, var(--card) 90%, transparent) 0%, color-mix(in oklch, var(--card) 78%, transparent) 100%)"
      : "linear-gradient(to bottom, color-mix(in oklch, var(--card) 86%, transparent) 0%, color-mix(in oklch, var(--card) 74%, transparent) 100%)";
  }
  return "linear-gradient(to bottom, var(--card) 0%, color-mix(in oklch, var(--card) 94%, var(--muted)) 100%)";
}

/** The two static radial glows (switches, inputs). */
export function HaloUnderglow({ dim = false }: { dim?: boolean }) {
  return (
    <div className={cn("absolute inset-0", dim ? "opacity-40" : "opacity-55")}>
      <div
        className="absolute inset-0 blur-2xl"
        style={{ background: haloUnderglow[0] }}
      />
      <div
        className="absolute inset-0 opacity-70 blur-xl dark:opacity-50"
        style={{ background: haloUnderglow[1] }}
      />
    </div>
  );
}

type BlobSpec = {
  bg: keyof HaloRamp;
  path: [string, string, string];
  duration: number;
  className: string;
};

const blobSets = {
  sm: [
    {
      bg: "primary",
      path: ["-5%", "75%", "-5%"],
      duration: 6,
      className: "-bottom-4 h-14 w-44 blur-xl",
    },
    {
      bg: "secondary",
      path: ["65%", "10%", "65%"],
      duration: 5,
      className: "-bottom-3 h-11 w-36 blur-lg",
    },
  ],
  lg: [
    {
      bg: "primary",
      path: ["-5%", "75%", "-5%"],
      duration: 6,
      className: "-bottom-10 h-32 w-88 blur-2xl",
    },
    {
      bg: "secondary",
      path: ["65%", "10%", "65%"],
      duration: 5,
      className: "-bottom-7 h-24 w-52 blur-2xl",
    },
    {
      bg: "tertiary",
      path: ["25%", "55%", "25%"],
      duration: 4,
      className: "-bottom-5 h-20 w-44 blur-xl",
    },
  ],
} satisfies Record<string, BlobSpec[]>;

/**
 * Coloured blobs along the bottom edge. They rest at their first position and
 * drift only while `active`.
 */
export function HaloBlobs({
  active,
  size = "sm",
  opacity,
  height = "h-1/2",
  ramp = haloRamp,
}: {
  active: boolean;
  size?: keyof typeof blobSets;
  opacity: number;
  height?: string;
  ramp?: HaloRamp;
}) {
  const reduce = useReducedMotion() ?? false;
  const move = active && !reduce;
  return (
    <motion.div
      animate={{ opacity }}
      className={cn("absolute inset-x-0 bottom-0", height)}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {blobSets[size].map((b) => (
        <motion.div
          key={b.bg}
          initial={false}
          animate={{ left: move ? b.path : b.path[0] }}
          className={cn("absolute", b.className)}
          style={{ background: ramp[b.bg] }}
          transition={
            move
              ? { duration: b.duration, ease: "easeInOut", repeat: Infinity }
              : { duration: 0.6, ease: "easeOut" }
          }
        />
      ))}
    </motion.div>
  );
}

/**
 * Clip for the glow layers. `overflow: hidden` + border-radius is not enough:
 * Chrome draws the animated, blurred blobs on their own GPU layers and lets
 * them escape the rounded corners as hard boxes. `clip-path` clips those too.
 */
export function roundClip(radius: string) {
  return { clipPath: `inset(0 round ${radius})` } as const;
}

/** Spring shared by thumbs and layout changes across the set. */
export const haloSpring = {
  type: "spring" as const,
  bounce: 0.12,
  damping: 34,
  stiffness: 420,
};
