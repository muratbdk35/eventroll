"use client";

// Adapted from 21st.dev "Admit One Ticket" (larsen66, MIT): a dithered ticket
// with rounded corners, notches at a perforated stub, the holder's name set
// large and fitted to the space, and a 3D tilt with glare on hover. Changes by
// eventroll: powder-blue palette, the texture is still (the original drifts
// forever; a still ticket costs nothing on a guest's phone), the official
// @paper-design/shaders-react package (Apache-2.0) instead of a bundled copy,
// fluid width (container units, so it renders on the server), our fonts, no
// shutter sound.

import { Dithering } from "@paper-design/shaders-react";
import { useCallback, useRef, useSyncExternalStore } from "react";
import {
  DEFAULT_TICKET_COLOR,
  TICKET_COLORS,
  type TicketColor,
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

const pct = (fraction: number) => `${(fraction * 100).toFixed(4)}cqw`;

/*
 * The ticket's shape, cut with a CSS mask instead of a measured clip-path:
 * six circles bitten out (the four scooped corners and the two notches at the
 * perforation), each a full-size layer, intersected. Sized in container
 * units, so the ticket renders complete on the server; it is the guest
 * page's largest element (DECISIONS #49).
 */
const R = pct(GEOMETRY.cornerRadius);
const NOTCH = pct(GEOMETRY.notchRadius);
const AT = `${(GEOMETRY.perforation * 100).toFixed(3)}%`;
const bite = (radius: string, x: string, y: string) =>
  `radial-gradient(circle ${radius} at ${x} ${y}, transparent 98%, #000 100%)`;
const MASK = [
  bite(R, "0", "0"),
  bite(R, "100%", "0"),
  bite(R, "100%", "100%"),
  bite(R, "0", "100%"),
  bite(NOTCH, AT, "0"),
  bite(NOTCH, AT, "100%"),
].join(", ");
const SHAPE: React.CSSProperties = {
  WebkitMaskImage: MASK,
  maskImage: MASK,
  WebkitMaskComposite: "source-in",
  maskComposite: "intersect",
};

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

const noop = () => () => {};
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
  /** Colour id (lib/events/ticket.ts); powder blue by default. */
  color?: TicketColor;
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
  color = DEFAULT_TICKET_COLOR,
  className,
}: EventTicketProps) {
  const COLORS = TICKET_COLORS[color];
  const card = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);
  // Both hooks run on every render (no short-circuit between them).
  const finePointer = useMedia(hoverQuery);
  const reducedMotion = useMedia(motionQuery);
  const canTilt = finePointer && !reducedMotion;
  // The texture is WebGL, so it joins after hydration; until then the ticket
  // shows its base colour with every line of text already in place.
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

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

  const lines = splitName(name);
  // Every measure is a fraction of the width, so the fit is too.
  const scale = fitScale(lines, {
    width: GEOMETRY.perforation - LAYOUT.padding * 1.6,
    height: LAYOUT.footerTop - LAYOUT.nameTop - 0.02,
    size: LAYOUT.nameSize,
    lead: LAYOUT.nameLead,
  });
  const stubBox: React.CSSProperties = {
    left: pct(GEOMETRY.perforation),
    top: 0,
    width: pct(1 - GEOMETRY.perforation),
    height: "100%",
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={card}
        role="img"
        aria-label={`${name}. ${event}. ${footer}`}
        className="[container-type:inline-size] relative mx-auto w-full drop-shadow-[0_24px_30px_rgb(20_35_60/0.28)] select-none"
        style={{ maxWidth, aspectRatio: `${GEOMETRY.aspect}` }}
        onPointerMove={canTilt ? onMove : undefined}
        onPointerLeave={canTilt ? onLeave : undefined}
      >
        <div
          aria-hidden
          className="absolute inset-0 overflow-hidden"
          style={{ ...SHAPE, background: COLORS.back }}
        >
          {mounted && (
            <Dithering
              colorBack={COLORS.back}
              colorFront={COLORS.front}
              shape="warp"
              type="random"
              size={0.5}
              speed={0}
              frame={12000}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
            />
          )}
          {/* perforation */}
          <div
            className="absolute inset-y-0"
            style={{
              left: pct(GEOMETRY.perforation),
              width: `max(1px, ${pct(0.0022)})`,
              backgroundImage: `repeating-linear-gradient(to bottom, ${COLORS.ink}66 0 ${pct(0.012)}, transparent ${pct(0.012)} ${pct(0.024)})`,
            }}
          />
          {watermark && (
            <div
              className="absolute grid place-items-center font-heading font-semibold tabular-nums"
              style={{ ...stubBox, color: COLORS.watermark, opacity: 0.55 }}
            >
              <span
                style={{
                  writingMode: "vertical-rl",
                  fontSize: pct(LAYOUT.watermarkSize),
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
                left: pct(LAYOUT.padding),
                top: pct(LAYOUT.labelTop),
                fontSize: pct(LAYOUT.labelSize),
                lineHeight: pct(LAYOUT.labelLead),
              }}
            >
              {presenter}
              {"\n"}
              {event}
            </div>
            <div
              className="absolute font-heading font-semibold tracking-[-0.015em]"
              style={{
                left: pct(LAYOUT.padding),
                top: pct(LAYOUT.nameTop),
                fontSize: pct(LAYOUT.nameSize * scale),
                lineHeight: pct(LAYOUT.nameLead * scale),
              }}
            >
              {lines.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
            <div
              className="absolute font-semibold tracking-[0.04em] whitespace-nowrap uppercase"
              style={{
                left: pct(LAYOUT.padding),
                top: pct(LAYOUT.footerTop),
                fontSize: pct(LAYOUT.footerSize),
              }}
            >
              {footer}
            </div>
            <div
              className="absolute grid place-items-center font-semibold whitespace-nowrap uppercase opacity-90"
              style={{ ...stubBox, fontSize: pct(LAYOUT.stubSize) }}
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
            style={SHAPE}
          />
        )}
      </div>
    </div>
  );
}
