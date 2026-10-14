"use client";

// Adapted from cult/ui "Halo Card" (MIT, nolly-studio/cult-ui): frosted
// surface over a gradient rim, layered shadow, and a light trail that runs
// along the edge while the card is hovered or focused. Changes by eventroll:
// our palette, blobs drift only while active, no backdrop-filter, larger
// radius to match our cards, `as` for semantic roots.

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect, useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import {
  HaloBlobs,
  haloFill,
  haloRamp,
  haloSuccessRamp,
  roundClip,
} from "./glow";

const TRAIL_LOOP_MS = 5250;

/** A highlight travelling round the border (masked to the border band). */
export function BorderTrail({
  active,
  radius,
}: {
  active: boolean;
  radius: number;
}) {
  const progress = useMotionValue(0);
  const offsetDistance = useTransform(
    progress,
    (v: number) => `${((v % 100) + 100) % 100}%`,
  );

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      progress.set(progress.get() + ((now - last) / TRAIL_LOOP_MS) * 100);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, progress]);

  const box = {
    height: 32,
    width: 184,
    offsetPath: `rect(0 auto auto 0 round ${radius}px)`,
  } as const;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)] [mask-composite:intersect] [mask-clip:padding-box,border-box] transition-opacity duration-300",
        active ? "opacity-100" : "opacity-0",
      )}
    >
      <motion.div
        className="absolute opacity-95"
        style={{ ...box, filter: "blur(12px)", offsetDistance }}
      >
        <div
          className="size-full rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(105,145,195,0) 6%, rgba(105,145,195,0.4) 24%, rgba(150,165,220,0.45) 50%, rgba(170,198,232,0.42) 76%, rgba(170,198,232,0) 94%, transparent 100%)",
          }}
        />
      </motion.div>
      <motion.div
        className="absolute"
        style={{ ...box, filter: "blur(4px)", offsetDistance }}
      >
        <div
          className="size-full rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(84,125,175,0.75) 20%, rgba(190,210,235,0.95) 50%, rgba(170,198,232,0.8) 80%, transparent 100%)",
          }}
        />
      </motion.div>
    </div>
  );
}

const padding = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
} as const;

export type HaloCardProps = ComponentProps<"div"> & {
  /** Hover/focus brighten the rim and run the edge trail. */
  interactive?: boolean;
  /** Keep the rim lit (e.g. the selected option). */
  emphasis?: boolean;
  padding?: keyof typeof padding;
  surfaceClassName?: string;
  /** Rim colours: our warm ramp, or green for success messages. */
  rim?: "default" | "success";
  /** Frosted fill (glow reads through) or solid, for cards over content. */
  translucent?: boolean;
};

export function HaloCard({
  children,
  className,
  surfaceClassName,
  interactive = true,
  emphasis = false,
  padding: pad = "md",
  rim = "default",
  translucent = true,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: HaloCardProps) {
  const reduce = useReducedMotion() ?? false;
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const active = interactive && (hover || focus);
  const lit = active || emphasis;

  return (
    <div
      className={cn("relative w-full max-w-full", className)}
      data-slot="halo-card"
      onMouseEnter={(e) => {
        setHover(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHover(false);
        onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        setFocus(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocus(false);
        }
        onBlur?.(e);
      }}
      {...props}
    >
      <div className="relative rounded-[1.6rem] p-px">
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[1.6rem]"
          style={roundClip("1.6rem")}
        >
          <HaloBlobs
            active={active}
            size="lg"
            height="h-[58%]"
            opacity={lit ? 0.9 : 0.6}
            ramp={rim === "success" ? haloSuccessRamp : haloRamp}
          />
        </div>
        <div
          data-slot="halo-card-surface"
          className={cn(
            "relative z-0 flex flex-col gap-6 rounded-[calc(1.6rem-1px)] border border-border/90",
            "shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_1px_2px_rgba(0,0,0,0.04),0_18px_40px_-24px_rgba(20,35,60,0.25)]",
            "transition-[border-color,box-shadow] duration-200 ease-out",
            lit && "border-ring/40",
            padding[pad],
            surfaceClassName,
          )}
          style={{ background: haloFill(translucent, lit) }}
        >
          {children}
        </div>
        {interactive && !reduce && (
          <div
            className="pointer-events-none absolute inset-0 z-10 rounded-[1.6rem]"
            style={roundClip("1.6rem")}
          >
            <BorderTrail active={active} radius={25} />
          </div>
        )}
      </div>
    </div>
  );
}
