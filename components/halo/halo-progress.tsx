"use client";

// Adapted from cult/ui "Halo Progress" (MIT, nolly-studio/cult-ui): framed
// track with a warm rim glow, determinate fill animated with `scaleX` (not
// width), sliding strip when indeterminate. Changes by eventroll: palette,
// rim blobs still (the bar itself is the motion), no backdrop-filter.

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HaloBlobs, haloSpring, roundClip } from "./glow";

export type HaloProgressProps = {
  /** 0–100, or null for indeterminate. */
  value: number | null;
  label?: ReactNode;
  /** Text on the right of the label row (e.g. "Step 2 of 5"). */
  aside?: ReactNode;
  className?: string;
  size?: "sm" | "md";
  "aria-label"?: string;
};

export function HaloProgress({
  value,
  label,
  aside,
  className,
  size = "sm",
  "aria-label": ariaLabel,
}: HaloProgressProps) {
  const reduce = useReducedMotion() ?? false;
  const pct = value === null ? 0 : Math.min(1, Math.max(0, value / 100));

  return (
    <ProgressPrimitive.Root
      value={value}
      aria-label={label ? undefined : ariaLabel}
      className={cn("flex w-full flex-col gap-2", className)}
    >
      {(label || aside) && (
        <div className="flex items-baseline justify-between gap-3 text-xs">
          {label ? (
            <ProgressPrimitive.Label className="font-semibold text-foreground">
              {label}
            </ProgressPrimitive.Label>
          ) : (
            <span />
          )}
          {aside && (
            <span className="text-muted-foreground tabular-nums">{aside}</span>
          )}
        </div>
      )}
      <div className="relative w-full rounded-full p-px">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
          style={roundClip("9999px")}
        >
          <HaloBlobs active={false} opacity={0.45} />
        </div>
        <ProgressPrimitive.Track
          className={cn(
            "relative w-full overflow-hidden rounded-full border border-border/80 bg-[color-mix(in_oklch,var(--muted)_70%,white)]",
            "shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_1px_2px_rgba(0,0,0,0.05)]",
            size === "md" ? "h-2.5" : "h-2",
          )}
        >
          {value === null ? (
            <motion.div
              aria-hidden
              className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-gradient-to-r from-primary/25 via-primary to-primary/25"
              animate={reduce ? { x: "0%" } : { x: ["-45%", "145%"] }}
              transition={{
                duration: reduce ? 0 : 1.15,
                ease: "easeInOut",
                repeat: reduce ? 0 : Infinity,
              }}
            />
          ) : (
            <motion.div
              aria-hidden
              initial={false}
              animate={{ scaleX: pct }}
              transition={reduce ? { duration: 0 } : haloSpring}
              className="absolute inset-0 origin-left rounded-full bg-gradient-to-b from-[oklch(0.64_0.073_241)] to-primary shadow-[0_1px_0_rgba(255,255,255,0.3)_inset] rtl:origin-right"
            />
          )}
        </ProgressPrimitive.Track>
      </div>
    </ProgressPrimitive.Root>
  );
}
