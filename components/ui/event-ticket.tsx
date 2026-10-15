"use client";

// Adapted from 21st.dev "Admit One Ticket" (larsen66, MIT): a dithered ticket
// with rounded corners, notches at a perforated stub, the holder's name set
// large and fitted to the space, and a 3D tilt with glare on hover. Changes by
// eventroll: powder-blue palette, the texture is still (the original drifts
// forever; a still ticket costs nothing on a guest's phone), the official
// @paper-design/shaders-react package (Apache-2.0) instead of a bundled copy,
// fluid width, our fonts, no shutter sound.

import { Dithering } from "@paper-design/shaders-react";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  DEFAULT_TICKET,
  TICKET_COLORS,
  TICKET_PATTERNS,
  type TicketColor,
  type TicketPattern,
} from "@/lib/events/ticket";
import { cn } from "@/lib/utils";

const GEOMETRY = {
  aspect: 741 / 425,
  cornerRadius: 25 / 741,
  notchRadius: 21 / 741,
  perforation: 562 / 741,
};

const LAYOUT = {
  padding: 52 / 741,
  labelTop: 54 / 741,
  labelSize: 19 / 741,
  labelLead: 28 / 741,
  nameTop: 168 / 741,
  nameSize: 68 / 741,
  nameLead: 70 / 741,
  footerTop: 352 / 741,
  footerSize: 19 / 741,
  stubSize: 52 / 741,
  watermarkSize: 132 / 741,
};

const WATERMARK = "rgb(255 255 255 / 0.85)";

function clipPath(width: number, height: number) {
  const r = GEOMETRY.cornerRadius * width;
  const n = GEOMETRY.notchRadius * width;
  const p = GEOMETRY.perforation * width;
  return [
    `M ${r} 0`,
    `L ${p - n} 0`,
    `A ${n} ${n} 0 0 0 ${p + n} 0`,
    `L ${width - r} 0`,
    `A ${r} ${r} 0 0 0 ${width} ${r}`,
    `L ${width} ${height - r}`,
    `A ${r} ${r} 0 0 0 ${width - r} ${height}`,
    `L ${p + n} ${height}`,
    `A ${n} ${n} 0 0 0 ${p - n} ${height}`,
    `L ${r} ${height}`,
    `A ${r} ${r} 0 0 0 0 ${height - r}`,
    `L 0 ${r}`,
    `A ${r} ${r} 0 0 0 ${r} 0`,
    "Z",
  ].join(" ");
}

/**
 * Wraps the name by length (not one word per line, which split "Elif & Can"
 * into three lines): words fill a line up to ~12 characters, at most three
 * lines, extra words join the last one.
 */
function splitName(name: string, max = 3, perLine = 12) {
  const words = name.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  const lines: string[] = [];
  for (const w of words) {
    const last = lines[lines.length - 1];
    if (
      last !== undefined &&
      (last.length + 1 + w.length <= perLine || lines.length >= max)
    ) {
      lines[lines.length - 1] = `${last} ${w}`;
    } else {
      lines.push(w);
    }
  }
  return lines;
}

/** Shrinks the name until its longest line and all lines fit. */
function fitScale(
  lines: string[],
  o: { width: number; height: number; size: number; lead: number },
) {
  if (!lines.length) return 1;
  const longest = Math.max(...lines.map((l) => l.length));
  const charWidth = 0.56 * o.size;
  return Math.max(
    0.3,
    Math.min(
      1,
      o.width / (longest * charWidth),
      o.height / (lines.length * o.lead),
    ),
  );
}

const hoverQuery = "(hover: hover) and (pointer: fine)";
const motionQuery = "(prefers-reduced-motion: reduce)";
function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export type EventTicketProps = {
  /** Two small lines at the top left, e.g. "EventRoll presents" / type. */
  presenter: string;
  event: string;
  /** The big text: the event's name. */
  name: string;
  /** Bottom line, e.g. the date. */
  footer: string;
  /** Vertical text on the stub. */
  stub: string;
  /** Large faint number on the stub, e.g. the year. */
  watermark?: string;
  /** Widest the ticket may grow; it fills its container up to this. */
  maxWidth?: number;
  /** Colour and pattern ids (lib/events/ticket.ts); powder + plain by default. */
  color?: TicketColor;
  pattern?: TicketPattern;
  className?: string;
};

export function EventTicket({
  presenter,
  event,
  name,
  footer,
  stub,
  watermark,
  maxWidth = 560,
  color = DEFAULT_TICKET.color,
  pattern = DEFAULT_TICKET.pattern,
  className,
}: EventTicketProps) {
  const COLORS = TICKET_COLORS[color];
  const P = TICKET_PATTERNS[pattern];
  const box = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  // Both hooks run on every render (no short-circuit between them).
  const finePointer = useMedia(hoverQuery);
  const reducedMotion = useMedia(motionQuery);
  const canTilt = finePointer && !reducedMotion;

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setWidth(Math.min(maxWidth, Math.floor(e.contentRect.width))),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxWidth]);

  const onMove = useCallback((e: React.PointerEvent) => {
    const el = card.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    el.style.transition = "none";
    el.style.transform = `perspective(1200px) rotateX(${-dy * 14}deg) rotateY(${dx * 14}deg) scale(1.02)`;
    if (glare.current) {
      glare.current.style.background = `radial-gradient(38% 55% at ${(dx + 0.5) * 100}% ${(dy + 0.5) * 100}%, rgba(255,255,255,0.18), rgba(255,255,255,0) 70%)`;
    }
  }, []);
  const onLeave = useCallback(() => {
    if (card.current) {
      card.current.style.transition =
        "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)";
      card.current.style.transform = "none";
    }
    if (glare.current) glare.current.style.background = "transparent";
  }, []);

  const height = width / GEOMETRY.aspect;
  const perfX = GEOMETRY.perforation * width;
  const lines = splitName(name);
  const scale = fitScale(lines, {
    width: perfX - LAYOUT.padding * width * 1.6,
    height: (LAYOUT.footerTop - LAYOUT.nameTop - 0.02) * width,
    size: LAYOUT.nameSize * width,
    lead: LAYOUT.nameLead * width,
  });
  const path = width ? `path('${clipPath(width, height)}')` : undefined;

  return (
    <div ref={box} className={cn("w-full", className)}>
      {width > 0 && (
        <div
          ref={card}
          role="img"
          aria-label={`${name}. ${event}. ${footer}`}
          className="relative mx-auto drop-shadow-[0_24px_30px_rgb(20_35_60/0.28)] select-none"
          style={{ width, height }}
          onPointerMove={canTilt ? onMove : undefined}
          onPointerLeave={canTilt ? onLeave : undefined}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ clipPath: path, background: COLORS.back }}
          >
            <Dithering
              colorBack={COLORS.back}
              colorFront={COLORS.front}
              shape={P.shape}
              type={P.type}
              size={P.size}
              speed={0}
              frame={12000}
              style={{ position: "absolute", inset: 0, width, height }}
            />
            {/* perforation */}
            <div
              className="absolute inset-y-0"
              style={{
                left: perfX,
                width: Math.max(1, 0.0022 * width),
                backgroundImage: `repeating-linear-gradient(to bottom, ${COLORS.ink}66 0 ${0.012 * width}px, transparent ${0.012 * width}px ${0.024 * width}px)`,
              }}
            />
            {watermark && (
              <div
                className="absolute grid place-items-center font-heading font-semibold tabular-nums"
                style={{
                  left: perfX,
                  top: 0,
                  width: width - perfX,
                  height,
                  color: WATERMARK,
                  opacity: 0.55,
                }}
              >
                <span
                  style={{
                    writingMode: "vertical-rl",
                    fontSize: LAYOUT.watermarkSize * width,
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {watermark}
                </span>
              </div>
            )}
            <div className="absolute inset-0" style={{ color: COLORS.ink }}>
              <div
                className="absolute font-semibold tracking-[0.04em] whitespace-pre uppercase"
                style={{
                  left: LAYOUT.padding * width,
                  top: LAYOUT.labelTop * width,
                  fontSize: LAYOUT.labelSize * width,
                  lineHeight: `${LAYOUT.labelLead * width}px`,
                }}
              >
                {presenter}
                {"\n"}
                {event}
              </div>
              <div
                className="absolute font-heading font-semibold tracking-[-0.015em]"
                style={{
                  left: LAYOUT.padding * width,
                  top: LAYOUT.nameTop * width,
                  fontSize: LAYOUT.nameSize * width * scale,
                  lineHeight: `${LAYOUT.nameLead * width * scale}px`,
                }}
              >
                {lines.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
              <div
                className="absolute font-semibold tracking-[0.04em] whitespace-nowrap uppercase"
                style={{
                  left: LAYOUT.padding * width,
                  top: LAYOUT.footerTop * width,
                  fontSize: LAYOUT.footerSize * width,
                }}
              >
                {footer}
              </div>
              <div
                className="absolute grid place-items-center font-semibold whitespace-nowrap uppercase opacity-90"
                style={{
                  left: perfX,
                  top: 0,
                  width: width - perfX,
                  height,
                  fontSize: LAYOUT.stubSize * width,
                }}
              >
                <span style={{ writingMode: "vertical-rl" }}>{stub}</span>
              </div>
            </div>
          </div>
          {canTilt && (
            <div
              ref={glare}
              aria-hidden
              className="pointer-events-none absolute inset-0 transition-[background] duration-500"
              style={{ clipPath: path }}
            />
          )}
        </div>
      )}
      {width === 0 && (
        <div
          aria-hidden
          className="mx-auto"
          style={{ aspectRatio: `${GEOMETRY.aspect}`, maxWidth }}
        />
      )}
    </div>
  );
}
