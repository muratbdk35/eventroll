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
  // Words stay whole and may wrap onto a second line (long German labels on
  // narrow phones); the glyphs inside a word fade in one by one.
  const words = useMemo(() => {
    const seen = new Map<string, number>();
    return text.split(" ").map((word, w) => ({
      key: `${word}-${w}`,
      chars: Array.from(word, (char) => {
        const n = seen.get(char) ?? 0;
        seen.set(char, n + 1);
        return { char, key: `${char}-${n}` };
      }),
    }));
  }, [text]);
  return (
    <>
      <span className="sr-only">{text}</span>
      <motion.span
        key={text}
        initial={text === firstText ? false : "hidden"}
        animate="visible"
        aria-hidden
        className="inline-flex flex-wrap items-center justify-center gap-x-[0.25em] text-center"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: reduce ? 0 : stagger } },
        }}
      >
        {words.map((w) => (
          <span key={w.key} className="inline-flex whitespace-nowrap">
            {w.chars.map((g) => (
              <motion.span
                key={g.key}
                className="inline-block whitespace-pre"
                transition={{
                  duration: reduce ? 0 : duration,
                  ease: "easeOut",
                }}
                variants={{
                  hidden: { opacity: reduce ? 1 : 0 },
                  visible: { opacity: 1 },
                }}
              >
                {g.char}
              </motion.span>
            ))}
          </span>
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
    // Pressing and dimming happen on the wrapper below, so the rim and its
    // glow move with the button instead of sticking out of it.
    "disabled:pointer-events-none aria-disabled:pointer-events-none",
    isLoading && "cursor-progress",
    size === "lg"
      ? "min-h-14 px-7 py-2 text-base"
      : "min-h-11 px-6 py-1.5 text-sm",
    fullWidth && "w-full",
    primary
      ? "border-[color-mix(in_oklch,var(--primary),black_6%)] text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.28)_inset,0_-1px_0_rgba(0,0,0,0.12)_inset,0_10px_24px_-10px_var(--primary)] fine-hover:hover:brightness-[1.06]"
      : "border-[color-mix(in_oklch,var(--border)_70%,color-mix(in_oklch,var(--primary),white_65%))] text-foreground shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_1px_2px_rgba(0,0,0,0.04),0_4px_14px_rgba(20,35,60,0.06)]",
  );
  const style = {
    background: primary
      ? "linear-gradient(180deg, color-mix(in oklch, var(--primary), white 20%) 0%, var(--primary) 55%, color-mix(in oklch, var(--primary), black 3%) 100%)"
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
    // No layout animation here: it scales the wrapper while the width
    // changes (e.g. to the loading text), which stretched the pill's round
    // ends and its glow for a moment. The label fades in instead.
    <div
      className={cn(
        "relative inline-flex max-w-full",
        fullWidth && "flex w-full",
        className,
      )}
    >
      <div
        className={cn(
          "relative rounded-full p-px transition-[transform,opacity] duration-200 ease-out",
          // A loading button keeps its colour; only a disabled one fades.
          disabled && !isLoading
            ? "pointer-events-none opacity-50"
            : !isLoading &&
                "has-[>:active]:scale-[0.97] motion-reduce:has-[>:active]:scale-100",
          fullWidth && "w-full",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
          style={roundClip("9999px")}
        >
          {/* Only the main action glows (DECISIONS #40). */}
          {primary && (
            <HaloBlobs
              active={hot && !disabled && !isLoading}
              opacity={hot && !isLoading ? 0.9 : 0.6}
            />
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
    </div>
  );
}
