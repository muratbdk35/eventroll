"use client";

// Adapted from cult/ui "Halo Switch" (MIT, nolly-studio/cult-ui): frosted
// pill track with a warm underglow, spring thumb, ≥44px touch target.
// Changes by eventroll: our palette (checked track is powder blue, not a
// pastel ramp), no backdrop-filter, and the Radix switch primitive instead
// of Base UI's, so `id` lands on the button and <label htmlFor> names it.

import { motion, useReducedMotion } from "framer-motion";
import { Switch as SwitchPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { haloRim, haloSpring } from "./glow";

export type HaloSwitchProps = {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

/** Track 44×26, thumb 18, 4px inset each side → 18px travel. */
const TRAVEL = 18;

export function HaloSwitch({
  id,
  checked,
  onCheckedChange,
  disabled,
  className,
  "aria-label": ariaLabel,
}: HaloSwitchProps) {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className={cn("relative inline-flex rounded-full", className)}>
      <div
        className={cn(
          "relative rounded-full border",
          haloRim,
          "shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_1px_2px_rgba(0,0,0,0.03),0_6px_18px_rgba(20,35,60,0.05)]",
        )}
      >
        <SwitchPrimitive.Root
          id={id}
          aria-label={ariaLabel}
          checked={checked}
          disabled={disabled}
          onCheckedChange={onCheckedChange}
          className={cn(
            "relative flex h-[26px] w-11 shrink-0 cursor-pointer items-center rounded-full px-[3px] outline-none",
            "transition-[background-color,box-shadow] duration-200 ease-out",
            "after:absolute after:-inset-x-2 after:-inset-y-[10px] after:content-['']",
            "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "data-[state=unchecked]:bg-[color-mix(in_oklch,var(--muted)_60%,oklch(0.93_0.02_243))]",
            "data-[state=checked]:bg-[linear-gradient(180deg,oklch(0.66_0.073_241)_0%,var(--primary)_100%)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <SwitchPrimitive.Thumb asChild>
            <motion.span
              initial={false}
              animate={{ x: checked ? TRAVEL : 0 }}
              transition={reduce ? { duration: 0 } : haloSpring}
              whileTap={reduce ? undefined : { scale: 0.92 }}
              className={cn(
                "pointer-events-none block size-[18px] rounded-full bg-white ring-1 ring-black/8 rtl:-scale-x-100",
                "shadow-[0_1px_0_rgba(255,255,255,0.85)_inset,0_1px_2px_rgba(0,0,0,0.12),0_2px_10px_rgba(0,0,0,0.06)]",
              )}
            />
          </SwitchPrimitive.Thumb>
        </SwitchPrimitive.Root>
      </div>
    </div>
  );
}
