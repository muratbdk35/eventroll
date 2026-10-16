import type { ReactNode } from "react";
import {
  TICKET_COLORS,
  TICKET_THEMES,
  type TicketColor,
} from "@/lib/events/ticket";

/*
 * Printable QR templates (DECISIONS #51), drawn for next/og (Satori + resvg)
 * so the preview on screen and the downloaded PNG are the same picture.
 * The "elegant" design the owner picked: cream paper, a fine double frame
 * in the event's colour, the names large and centred in Fraunces, the date in
 * spaced capitals, the QR in a hairline frame, the headline in italic. Like a
 * wedding invitation. All measures are millimetres on A4. No EventRoll
 * branding on printed material (DECISIONS #21).
 */

export type TemplateId = "cards" | "tent" | "poster";

export type SheetText = {
  eventName: string;
  /** Already upper-cased for the locale ("14 HAZİRAN 2026"). */
  date: string;
  /** Already upper-cased for the locale ("MİSAFİR FOTOĞRAFLARI"). */
  label: string;
  headline: string;
  subline: string;
  noApp: string;
  cutHint: string;
  foldHint: string;
  pin?: string;
  pinLabel?: string;
};

export type SheetInput = {
  template: TemplateId;
  color: TicketColor;
  /** Plain white paper instead of cream: kind to home printers. */
  paper: boolean;
  qrSvg: string;
  text: SheetText;
  /** Output width in px; A4 is 210 mm wide, so px per mm = width / 210. */
  width: number;
};

export const A4 = { w: 210, h: 297 };

type Palette = { paper: string; ink: string; accent: string };

function palette(color: TicketColor, white: boolean): Palette {
  return {
    paper: white ? "#ffffff" : "#fbf8f2",
    ink: TICKET_COLORS[color].ink,
    accent: TICKET_THEMES[color].primary,
  };
}

type Mm = (v: number) => number;

const svgUri = (svg: string) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

/** Shrinks long names so they stay on one or two lines. */
function nameSize(name: string, base: number, width: number) {
  if (name.length <= width / (base * 0.5)) return base;
  // Two lines at a slightly smaller size before shrinking further.
  const two = base * 0.82;
  if (name.length <= (width / (two * 0.5)) * 2) return two;
  return Math.max(base * 0.5, (width * 2) / (name.length * 0.5));
}

function Frame({
  w,
  h,
  inset,
  p,
  mm,
}: {
  w: number;
  h: number;
  inset: number;
  p: Palette;
  mm: Mm;
}) {
  const gap = inset * 0.28;
  return (
    <>
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: mm(inset),
          top: mm(inset),
          width: mm(w - inset * 2),
          height: mm(h - inset * 2),
          border: `${mm(inset * 0.07)}px solid ${p.accent}`,
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: mm(inset + gap),
          top: mm(inset + gap),
          width: mm(w - (inset + gap) * 2),
          height: mm(h - (inset + gap) * 2),
          border: `${mm(inset * 0.03)}px solid ${p.accent}`,
          opacity: 0.6,
        }}
      />
    </>
  );
}

function Label({
  text,
  size,
  p,
  mm,
}: {
  text: string;
  size: number;
  p: Palette;
  mm: Mm;
}) {
  const rule = (
    <div
      style={{
        display: "flex",
        width: mm(size * 3.8),
        height: mm(size * 0.1),
        background: p.accent,
        opacity: 0.6,
      }}
    />
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: mm(size * 1.3) }}>
      {rule}
      <div
        style={{
          display: "flex",
          fontFamily: "Schibsted",
          fontWeight: 700,
          fontSize: mm(size),
          letterSpacing: mm(size * 0.24),
          color: p.accent,
        }}
      >
        {text}
      </div>
      {rule}
    </div>
  );
}

function Qr({
  svg,
  size,
  p,
  mm,
}: {
  svg: string;
  size: number;
  p: Palette;
  mm: Mm;
}) {
  return (
    <div
      style={{
        display: "flex",
        padding: mm(size * 0.06),
        background: "#ffffff",
        border: `${mm(size * 0.007)}px solid ${p.accent}`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori */}
      <img src={svgUri(svg)} width={mm(size)} height={mm(size)} alt="" />
    </div>
  );
}

function Pin({
  t,
  size,
  p,
  mm,
}: {
  t: SheetText;
  size: number;
  p: Palette;
  mm: Mm;
}) {
  if (!t.pin) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: mm(size * 0.8),
        fontFamily: "Geist Mono",
        fontWeight: 700,
        fontSize: mm(size),
        letterSpacing: mm(size * 0.22),
        color: p.ink,
      }}
    >
      <span style={{ color: p.accent }}>{t.pinLabel}</span>
      <span>{t.pin}</span>
    </div>
  );
}

/**
 * The portrait card (A6) and the poster (A4) share one composition; `s`
 * scales the type and spacing from the card's sizes.
 */
function Portrait({
  w,
  h,
  s,
  input,
  mm,
}: {
  w: number;
  h: number;
  s: number;
  input: SheetInput;
  mm: Mm;
}) {
  const p = palette(input.color, input.paper);
  const t = input.text;
  const inner = w - 24 * s;
  const name = nameSize(t.eventName, 11.5 * s, inner);
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: mm(w),
        height: mm(h),
        background: p.paper,
      }}
    >
      <Frame w={w} h={h} inset={5 * s} p={p} mm={mm} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          position: "absolute",
          left: 0,
          top: mm(15 * s),
          width: mm(w),
          height: mm(h - 30 * s),
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Label text={t.label} size={2.3 * s} p={p} mm={mm} />
          <div
            style={{
              display: "flex",
              marginTop: mm(5 * s),
              width: mm(inner),
              justifyContent: "center",
              textAlign: "center",
              fontFamily: "Fraunces",
              fontWeight: 600,
              fontSize: mm(name),
              lineHeight: 1.05,
              color: p.ink,
            }}
          >
            {t.eventName}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: mm(3 * s),
              fontFamily: "Schibsted",
              fontWeight: 500,
              fontSize: mm(2.5 * s),
              letterSpacing: mm(0.5 * s),
              color: p.ink,
              opacity: 0.7,
            }}
          >
            {t.date}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: mm(3 * s),
          }}
        >
          <Qr svg={input.qrSvg} size={(t.pin ? 40 : 44) * s} p={p} mm={mm} />
          <Pin t={t} size={2.8 * s} p={p} mm={mm} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              width: mm(inner),
              justifyContent: "center",
              textAlign: "center",
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: mm(6.4 * s),
              lineHeight: 1.1,
              color: p.ink,
            }}
          >
            {t.headline}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: mm(2.5 * s),
              width: mm(inner * 0.92),
              justifyContent: "center",
              textAlign: "center",
              fontFamily: "Schibsted",
              fontWeight: 500,
              fontSize: mm(2.7 * s),
              lineHeight: 1.4,
              color: p.ink,
              opacity: 0.75,
            }}
          >
            {t.subline}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: mm(3.2 * s),
              fontFamily: "Schibsted",
              fontWeight: 500,
              fontSize: mm(2.2 * s),
              letterSpacing: mm(0.2 * s),
              color: p.accent,
            }}
          >
            {t.noApp}
          </div>
        </div>
      </div>
    </div>
  );
}

/** One side of the tent card: words on the left, the QR on the right. */
function Landscape({
  w,
  h,
  input,
  mm,
}: {
  w: number;
  h: number;
  input: SheetInput;
  mm: Mm;
}) {
  const p = palette(input.color, input.paper);
  const t = input.text;
  const qr = h * 0.4;
  const textW = w - qr - 56;
  const name = nameSize(t.eventName, 13, textW);
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: mm(w),
        height: mm(h),
        background: p.paper,
      }}
    >
      <Frame w={w} h={h} inset={5} p={p} mm={mm} />
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: mm(19),
          top: mm(14),
          width: mm(w - 38),
          height: mm(h - 28),
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: mm(textW),
          }}
        >
          <Label text={t.label} size={2.5} p={p} mm={mm} />
          <div
            style={{
              display: "flex",
              marginTop: mm(4.5),
              width: mm(textW),
              justifyContent: "center",
              textAlign: "center",
              fontFamily: "Fraunces",
              fontWeight: 600,
              fontSize: mm(name),
              lineHeight: 1.05,
              color: p.ink,
            }}
          >
            {t.eventName}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: mm(2.6),
              fontFamily: "Schibsted",
              fontWeight: 500,
              fontSize: mm(2.8),
              letterSpacing: mm(0.55),
              color: p.ink,
              opacity: 0.7,
            }}
          >
            {t.date}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: mm(8),
              width: mm(textW),
              justifyContent: "center",
              textAlign: "center",
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: mm(7.2),
              lineHeight: 1.1,
              color: p.ink,
            }}
          >
            {t.headline}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: mm(2.2),
              width: mm(textW * 0.9),
              justifyContent: "center",
              textAlign: "center",
              fontFamily: "Schibsted",
              fontWeight: 500,
              fontSize: mm(3),
              lineHeight: 1.4,
              color: p.ink,
              opacity: 0.75,
            }}
          >
            {t.subline}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: mm(3),
              fontFamily: "Schibsted",
              fontWeight: 500,
              fontSize: mm(2.4),
              letterSpacing: mm(0.2),
              color: p.accent,
            }}
          >
            {t.noApp}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: mm(3),
          }}
        >
          <Qr svg={input.qrSvg} size={t.pin ? qr * 0.9 : qr} p={p} mm={mm} />
          <Pin t={t} size={2.6} p={p} mm={mm} />
        </div>
      </div>
    </div>
  );
}

function Abs({
  left,
  top,
  mm,
  rotate,
  children,
}: {
  left: number;
  top: number;
  mm: Mm;
  rotate?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        left: mm(left),
        top: mm(top),
        ...(rotate ? { transform: "rotate(180deg)" } : {}),
      }}
    >
      {children}
    </div>
  );
}

/** The whole A4 sheet for `ImageResponse`, `input.width` px wide. */
export function Sheet(input: SheetInput) {
  const k = input.width / A4.w;
  const mm: Mm = (v) => Math.round(v * k * 100) / 100;
  const t = input.text;
  const guide = "rgba(0,0,0,0.28)";
  const hint = {
    display: "flex" as const,
    position: "absolute" as const,
    padding: `0 ${mm(2)}px`,
    background: "#ffffff",
    fontFamily: "Schibsted",
    fontWeight: 500,
    fontSize: mm(2.6),
    color: "rgba(0,0,0,0.45)",
  };
  const line = (horizontal: boolean, at: number) => (
    <div
      style={{
        display: "flex",
        position: "absolute",
        ...(horizontal
          ? {
              top: mm(at),
              left: 0,
              width: mm(A4.w),
              borderTop: `${mm(0.25)}px dashed ${guide}`,
            }
          : {
              left: mm(at),
              top: 0,
              height: mm(A4.h),
              borderLeft: `${mm(0.25)}px dashed ${guide}`,
            }),
      }}
    />
  );

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: mm(A4.w),
        height: mm(A4.h),
        background: "#ffffff",
      }}
    >
      {input.template === "poster" && (
        <Portrait w={A4.w} h={A4.h} s={2} input={input} mm={mm} />
      )}

      {input.template === "cards" && (
        <>
          {[0, 1, 2, 3].map((n) => (
            <Abs
              key={n}
              left={(n % 2) * 105}
              top={Math.floor(n / 2) * 148.5}
              mm={mm}
            >
              <Portrait w={105} h={148.5} s={1} input={input} mm={mm} />
            </Abs>
          ))}
          {line(false, 105)}
          {line(true, 148.5)}
          <div style={{ ...hint, left: mm(105 + 3), top: mm(148.5 - 1.8) }}>
            {`✂ ${t.cutHint}`}
          </div>
        </>
      )}

      {input.template === "tent" && (
        <>
          {/* The top half is upside down so both sides read once folded. */}
          <Abs left={0} top={0} mm={mm} rotate>
            <Landscape w={A4.w} h={148.5} input={input} mm={mm} />
          </Abs>
          <Abs left={0} top={148.5} mm={mm}>
            <Landscape w={A4.w} h={148.5} input={input} mm={mm} />
          </Abs>
          {line(true, 148.5)}
          <div style={{ ...hint, right: mm(6), top: mm(148.5 - 1.8) }}>
            {t.foldHint}
          </div>
        </>
      )}
    </div>
  );
}

/** One A6 card on its own (the landing page's picture of the templates). */
export function SingleCard(input: SheetInput) {
  const k = input.width / 105;
  const mm: Mm = (v) => Math.round(v * k * 100) / 100;
  return <Portrait w={105} h={148.5} s={1} input={input} mm={mm} />;
}
