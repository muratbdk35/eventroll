"use client";

// Adapted from cult/ui "Halo Button" (MIT, nolly-studio/cult-ui): pill with a
// gradient rim of drifting blobs, staggered label, loading text with a
// trailing spinner. Changes by eventroll: our palette, blobs drift only on
// hover/focus, a solid powder-blue "primary" tone for the main action next to
// the original frosted one ("secondary"), and `href` renders a locale Link.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { HaloBlobs, haloFill, haloSpring, roundClip } from "./glow";

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("size-4 motion-safe:animate-spin", className)}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        className="opacity-25"
      />
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeDasharray="14 42"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Fades a label in glyph by glyph when its text changes (e.g. to a loading
 * text). The first text renders fully visible, also in the server HTML, so a
 * slow script never leaves a blank button.
 */
export function StaggeredText({
  text,
  stagger = 0.018,
  duration = 0.16,
}: {
  text: string;
  stagger?: number;
  duration?: number;
}) {
  const reduce = useReducedMotion() ?? false;
  const [firstText] = useState(text);
  const chars = useMemo(() => {
    const seen = new Map<string, number>();
    return Array.from(text, (char) => {
      const n = seen.get(char) ?? 0;
      seen.set(char, n + 1);
      return { char, key: `${char}-${n}` };
    });
  }, [text]);
  return (
    <>
      <span className="sr-only">{text}</span>
      <motion.span
        key={text}
        initial={text === firstText ? false : "hidden"}
        animate="visible"
        aria-hidden
        className="inline-flex items-center"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: reduce ? 0 : stagger } },
        }}
      >
        {chars.map((g) => (
          <motion.span
            key={g.key}
            className="inline-block whitespace-pre"
            transition={{ duration: reduce ? 0 : duration, ease: "easeOut" }}
            variants={{
              hidden: { opacity: reduce ? 1 : 0 },
              visible: { opacity: 1 },
            }}
          >
            {g.char}
          </motion.span>
        ))}
      </motion.span>
    </>
  );
}

type Common = {
  children: ReactNode;
  tone?: "primary" | "secondary";
  size?: "default" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  /** Icon after the label (hidden while loading). */
  trailing?: ReactNode;
  /** Icon before the label. */
  leading?: ReactNode;
  className?: string;
  fullWidth?: boolean;
};

export type HaloButtonProps = Common &
  (
    | ({ href?: undefined } & Omit<ComponentProps<"button">, "children">)
    | ({ href: string } & Omit<
        ComponentProps<typeof Link>,
        "children" | "href"
      >)
  );

export function HaloButton(props: HaloButtonProps) {
  const {
    children,
    tone = "primary",
    size = "default",
    isLoading = false,
    loadingText,
    trailing,
    leading,
    className,
    fullWidth,
    ...rest
  } = props;
  const reduce = useReducedMotion() ?? false;
  const [hot, setHot] = useState(false);
  const primary = tone === "primary";
  const disabled = "disabled" in rest && Boolean(rest.disabled);

  const label =
    isLoading && loadingText ? (
      <StaggeredText text={loadingText} stagger={0.03} duration={0.3} />
    ) : typeof children === "string" ? (
      <StaggeredText text={children} />
    ) : (
      children
    );

  const surface = cn(
    "relative flex min-w-0 items-center justify-center gap-2 rounded-full border font-semibold tracking-tight select-none antialiased outline-none",
    "transition-[transform,box-shadow,border-color,filter] duration-200 ease-out",
    "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:scale-[0.97] motion-reduce:active:scale-100",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50 disabled:pointer-events-none disabled:opacity-50",
    size === "lg" ? "min-h-14 px-7 text-base" : "min-h-11 px-6 text-sm",
    fullWidth && "w-full",
    primary
      ? "border-[oklch(0.5_0.069_239)] text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.28)_inset,0_-1px_0_rgba(0,0,0,0.12)_inset,0_10px_24px_-10px_var(--primary)] fine-hover:hover:brightness-[1.06]"
      : "border-[color-mix(in_oklch,var(--border)_70%,oklch(0.86_0.039_242))] text-foreground shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_1px_2px_rgba(0,0,0,0.04),0_4px_14px_rgba(20,35,60,0.06)]",
  );
  const style = {
    background: primary
      ? "linear-gradient(180deg, oklch(0.63 0.075 240) 0%, var(--primary) 55%, oklch(0.52 0.073 239) 100%)"
      : haloFill(true, hot),
  };
  const inner = (
    <>
      {leading && !isLoading && (
        <span className="flex shrink-0 [&_svg]:size-[1.15em]">{leading}</span>
      )}
      <span className="flex min-w-0 items-center justify-center">{label}</span>
      <AnimatePresence initial={false} mode="popLayout">
        {isLoading ? (
          <motion.span
            key="spin"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={reduce ? { duration: 0 } : haloSpring}
            className="flex shrink-0"
          >
            <Spinner />
          </motion.span>
        ) : trailing ? (
          <motion.span
            key="trail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex shrink-0 [&_svg]:size-[1.15em] rtl:[&_svg]:rotate-180"
          >
            {trailing}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </>
  );

  const events = {
    onMouseEnter: () => setHot(true),
    onMouseLeave: () => setHot(false),
    onFocus: () => setHot(true),
    onBlur: () => setHot(false),
  };

  return (
    <motion.div
      layout={!reduce}
      transition={{ layout: haloSpring }}
      className={cn(
        "relative inline-flex max-w-full",
        fullWidth && "flex w-full",
        className,
      )}
    >
      <div className={cn("relative rounded-full p-px", fullWidth && "w-full")}>
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
          style={roundClip("9999px")}
        >
          {/* Only the main action glows (DECISIONS #40). */}
          {primary && (
            <HaloBlobs active={hot && !disabled} opacity={hot ? 0.9 : 0.6} />
          )}
        </div>
        {rest.href !== undefined ? (
          <Link
            {...(rest as Omit<ComponentProps<typeof Link>, "children">)}
            {...events}
            className={surface}
            style={style}
          >
            {inner}
          </Link>
        ) : (
          <button
            type="button"
            {...(rest as Omit<ComponentProps<"button">, "children">)}
            {...events}
            disabled={disabled || isLoading}
            aria-busy={isLoading || undefined}
            className={surface}
            style={style}
          >
            {inner}
          </button>
        )}
      </div>
    </motion.div>
  );
}
