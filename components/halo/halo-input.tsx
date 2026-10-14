"use client";

// Adapted from cult/ui "Halo Input" (MIT, nolly-studio/cult-ui): frosted
// shell, warm gradient rim, focus ring. Changes: our palette, no drifting
// blobs inside the field (owner: nothing should move while typing), plain
// <input> instead of the Base UI wrapper, a "lg" size for single-question
// screens. See components/halo/glow.tsx.

import {
  forwardRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { HaloUnderglow, haloFill, haloRim, roundClip } from "./glow";

type ShellProps = {
  children: ReactNode;
  className?: string;
  invalid?: boolean;
  translucent?: boolean;
  radius?: string;
};

/** The rim + glow around any text-like control. */
export function HaloControlShell({
  children,
  className,
  invalid,
  translucent = true,
  radius = "rounded-[11px]",
}: ShellProps) {
  const clip = roundClip(radius === "rounded-2xl" ? "1rem" : "11px");
  const [focused, setFocused] = useState(false);
  return (
    <div
      className={cn(
        "relative isolate w-full max-w-full p-px",
        radius,
        className,
      )}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
      data-slot="halo-input-shell"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 overflow-hidden",
          radius,
        )}
        style={clip}
      >
        {/* Light only while the field is in use. */}
        {translucent && focused && <HaloUnderglow />}
      </div>
      <div
        className={cn(
          "relative z-1 border outline-none",
          haloRim,
          "shadow-[0_1px_2px_rgba(0,0,0,0.03),0_6px_18px_rgba(20,35,60,0.05)]",
          "before:pointer-events-none before:absolute before:inset-0 before:z-0 before:rounded-[inherit] before:shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] before:content-['']",
          "dark:border-border/80 dark:before:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
          "transition-[border-color,box-shadow] duration-200 ease-out",
          "focus-within:border-ring/80 focus-within:ring-2 focus-within:ring-ring/25",
          invalid &&
            "border-destructive/90 focus-within:border-destructive focus-within:ring-destructive/25",
          radius,
        )}
        style={{ background: haloFill(translucent, focused) }}
      >
        <div className="relative z-1">{children}</div>
      </div>
    </div>
  );
}

export type HaloInputProps = Omit<ComponentProps<"input">, "size"> & {
  invalid?: boolean;
  translucent?: boolean;
  leadingSlot?: ReactNode;
  trailingSlot?: ReactNode;
  shellClassName?: string;
  size?: "default" | "lg";
};

export const HaloInput = forwardRef<HTMLInputElement, HaloInputProps>(
  function HaloInput(
    {
      className,
      invalid,
      translucent = true,
      leadingSlot,
      trailingSlot,
      shellClassName,
      size = "default",
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) {
    const isInvalid =
      Boolean(invalid) || ariaInvalid === true || ariaInvalid === "true";
    const lg = size === "lg";
    return (
      <HaloControlShell
        className={shellClassName}
        invalid={isInvalid}
        translucent={translucent}
        radius={lg ? "rounded-2xl" : "rounded-[11px]"}
      >
        <div
          className={cn(
            "flex w-full items-center gap-2.5",
            lg ? "min-h-14 px-4" : "min-h-11 px-3 py-2",
          )}
        >
          {leadingSlot && (
            <span
              className={cn(
                "flex shrink-0 items-center text-muted-foreground",
                lg ? "[&_svg]:size-5" : "[&_svg]:size-4",
              )}
            >
              {leadingSlot}
            </span>
          )}
          <input
            ref={ref}
            aria-invalid={isInvalid || undefined}
            className={cn(
              "min-w-0 flex-1 border-0 bg-transparent p-0 text-foreground shadow-none outline-none placeholder:text-muted-foreground/80",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
              lg ? "text-lg font-medium" : "text-base md:text-sm",
              className,
            )}
            {...props}
          />
          {trailingSlot && (
            <span className="flex shrink-0 items-center text-muted-foreground [&_svg]:size-4">
              {trailingSlot}
            </span>
          )}
        </div>
      </HaloControlShell>
    );
  },
);
