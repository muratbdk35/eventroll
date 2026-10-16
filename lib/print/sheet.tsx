import {
  TICKET_COLORS,
  TICKET_THEMES,
  type TicketColor,
} from "@/lib/events/ticket";

/*
 * Printable QR templates (DECISIONS #51), drawn for next/og (Satori + resvg)
 * so the preview on screen and the downloaded PNG are the same picture. Every
 * piece is an admission ticket like the one on the guest page: scooped
 * corners, notches at a perforation, a halftone texture, the event's name on
 * the stub. The ticket itself (shape, texture, perforation) is one SVG; the
 * type is laid over it with flexbox. All measures are millimetres on A4.
 * No EventRoll branding on printed material (DECISIONS #21).
 */

export type TemplateId = "cards" | "tent" | "poster";

export type SheetText = {
  eventName: string;
  date: string;
  year: string;
  headline: string;
  subline: string;
  steps: [string, string, string];
  noApp: string;
  stubLabel: string;
  cutHint: string;
  foldHint: string;
  pin?: string;
  pinLabel?: string;
};

export type SheetInput = {
  template: TemplateId;
  color: TicketColor;
  /** White ticket with coloured line work: kind to home printers. */
  paper: boolean;
  qrSvg: string;
  text: SheetText;
  /** Output width in px; A4 is 210 mm wide, so px per mm = width / 210. */
  width: number;
};

export const A4 = { w: 210, h: 297 };

type Palette = {
  back: string;
  front: string;
  ink: string;
  soft: string;
  accent: string;
  outline: string | null;
};

function palette(color: TicketColor, paper: boolean): Palette {
  const c = TICKET_COLORS[color];
  const accent = TICKET_THEMES[color].primary;
  if (paper) {
    return {
      back: "#ffffff",
      front: c.front,
      ink: "#1c2430",
      soft: "#5b6573",
      accent,
      outline: accent,
    };
  }
  return {
    back: c.back,
    front: c.front,
    ink: c.ink,
    soft: c.ink,
    accent: c.ink,
    outline: null,
  };
}

/**
 * The halftone as a single path of circles. resvg draws an SVG <pattern>
 * tile by tile; one path rasterises a 300 dpi A4 in under 3 s instead of 12.
 */
function dots(w: number, h: number, step: number, r: number) {
  const parts: string[] = [];
  const f = (v: number) => Math.round(v * 100) / 100;
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      parts.push(
        `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`,
      );
    }
  }
  return parts.join("");
}

const svgUri = (svg: string) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

/**
 * The ticket body as SVG, in mm. `perf` is where the perforation runs:
 * across (portrait, stub at the bottom) or down (landscape, stub at the
 * right), measured from the top or left edge.
 */
function ticketSvg(
  w: number,
  h: number,
  perf: number,
  across: boolean,
  p: Palette,
  id: string,
) {
  const r = Math.min(w, h) * 0.055;
  const n = Math.min(w, h) * 0.045;
  // Clockwise outline; every bite is an arc with sweep 0, so it curves inwards.
  const d = across
    ? [
        `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 0 ${w} ${r}`,
        `L ${w} ${perf - n} A ${n} ${n} 0 0 0 ${w} ${perf + n}`,
        `L ${w} ${h - r} A ${r} ${r} 0 0 0 ${w - r} ${h}`,
        `L ${r} ${h} A ${r} ${r} 0 0 0 0 ${h - r}`,
        `L 0 ${perf + n} A ${n} ${n} 0 0 0 0 ${perf - n}`,
        `L 0 ${r} A ${r} ${r} 0 0 0 ${r} 0 Z`,
      ].join(" ")
    : [
        `M ${r} 0 L ${perf - n} 0 A ${n} ${n} 0 0 0 ${perf + n} 0`,
        `L ${w - r} 0 A ${r} ${r} 0 0 0 ${w} ${r}`,
        `L ${w} ${h - r} A ${r} ${r} 0 0 0 ${w - r} ${h}`,
        `L ${perf + n} ${h} A ${n} ${n} 0 0 0 ${perf - n} ${h}`,
        `L ${r} ${h} A ${r} ${r} 0 0 0 0 ${h - r}`,
        `L 0 ${r} A ${r} ${r} 0 0 0 ${r} 0 Z`,
      ].join(" ");
  const dot = Math.max(w, h) * 0.0042;
  const step = dot * 3.4;
  const dash = Math.max(w, h) * 0.012;
  const perfLine = across
    ? `M ${n + 1.5} ${perf} L ${w - n - 1.5} ${perf}`
    : `M ${perf} ${n + 1.5} L ${perf} ${h - n - 1.5}`;
  // A soft light wash from one corner, then a halftone that fades with it,
  // standing in for the dithered texture of the on-screen ticket.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <clipPath id="c${id}"><path d="${d}"/></clipPath>
    <radialGradient id="w${id}" cx="0" cy="${across ? 0.12 : 0.2}" r="${across ? 0.95 : 0.8}">
      <stop offset="0" stop-color="${p.front}" stop-opacity="${p.outline ? 0.55 : 0.85}"/>
      <stop offset="0.45" stop-color="${p.front}" stop-opacity="${p.outline ? 0.18 : 0.28}"/>
      <stop offset="1" stop-color="${p.front}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="f${id}" x1="0" y1="0" x2="1" y2="${across ? 1 : 0.4}">
      <stop offset="0" stop-color="#fff" stop-opacity="1"/>
      <stop offset="0.7" stop-color="#fff" stop-opacity="0.25"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0.05"/>
    </linearGradient>
    <mask id="m${id}"><rect width="${w}" height="${h}" fill="url(#f${id})"/></mask>
  </defs>
  <g clip-path="url(#c${id})">
    <rect width="${w}" height="${h}" fill="${p.back}"/>
    <rect width="${w}" height="${h}" fill="url(#w${id})"/>
    <path d="${dots(w, h, step, dot / 2)}" fill="${p.front}" mask="url(#m${id})" opacity="${p.outline ? 0.7 : 0.55}"/>
  </g>
  ${p.outline ? `<path d="${d}" fill="none" stroke="${p.outline}" stroke-width="${Math.max(w, h) * 0.0035}"/>` : ""}
  <path d="${perfLine}" stroke="${p.outline ?? p.ink}" stroke-opacity="${p.outline ? 0.6 : 0.4}" stroke-width="${Math.max(w, h) * 0.0028}" stroke-dasharray="${dash} ${dash * 0.9}" stroke-linecap="round"/>
</svg>`;
}

function qrPanel(qrSvg: string, size: number, mm: (v: number) => number) {
  return (
    <div
      style={{
        display: "flex",
        width: mm(size),
        height: mm(size),
        padding: mm(size * 0.075),
        background: "#ffffff",
        borderRadius: mm(size * 0.09),
        boxShadow: `0 ${mm(size * 0.03)}px ${mm(size * 0.08)}px rgba(15,25,40,0.22)`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
      <img
        src={svgUri(qrSvg)}
        width={mm(size * 0.85)}
        height={mm(size * 0.85)}
        alt=""
      />
    </div>
  );
}

function Steps({
  steps,
  p,
  size,
  mm,
}: {
  steps: [string, string, string];
  p: Palette;
  size: number;
  mm: (v: number) => number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        columnGap: mm(size * 1.1),
        rowGap: mm(size * 0.6),
      }}
    >
      {steps.map((s, i) => (
        <div
          key={s}
          style={{
            display: "flex",
            alignItems: "center",
            gap: mm(size * 0.45),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: mm(size * 1.7),
              height: mm(size * 1.7),
              borderRadius: 9999,
              background: p.outline ? p.accent : p.ink,
              color: p.outline ? "#ffffff" : p.back,
              fontFamily: "Schibsted",
              fontWeight: 700,
              fontSize: mm(size * 0.95),
            }}
          >
            {i + 1}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Schibsted",
              fontWeight: 700,
              fontSize: mm(size),
              color: p.ink,
            }}
          >
            {s}
          </div>
        </div>
      ))}
    </div>
  );
}

function PinChip({
  text,
  p,
  size,
  mm,
}: {
  text: SheetText;
  p: Palette;
  size: number;
  mm: (v: number) => number;
}) {
  if (!text.pin) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: mm(size * 0.7),
        padding: `${mm(size * 0.45)}px ${mm(size * 1.1)}px`,
        borderRadius: 9999,
        background: p.outline ? p.accent : p.ink,
        color: p.outline ? "#ffffff" : p.back,
        fontFamily: "Geist Mono",
        fontWeight: 700,
        fontSize: mm(size),
        letterSpacing: mm(size * 0.18),
      }}
    >
      <span style={{ opacity: 0.75 }}>{text.pinLabel}</span>
      <span>{text.pin}</span>
    </div>
  );
}

const caps = (size: number, color: string, mm: (v: number) => number) => ({
  display: "flex" as const,
  fontFamily: "Schibsted",
  fontWeight: 700,
  fontSize: mm(size),
  letterSpacing: mm(size * 0.16),
  color,
});

/** A portrait ticket: card (A6) and poster (A4) share the composition. */
function PortraitTicket({
  w,
  h,
  scale,
  input,
  mm,
  id,
}: {
  w: number;
  h: number;
  /** Type size relative to an A6 card. */
  scale: number;
  input: SheetInput;
  mm: (v: number) => number;
  id: string;
}) {
  const p = palette(input.color, input.paper);
  const t = input.text;
  const stub = h * 0.235;
  const perf = h - stub;
  const pad = w * 0.085;
  const s = (v: number) => v * scale;
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: mm(w),
        height: mm(h),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori */}
      <img
        src={svgUri(ticketSvg(w, h, perf, true, p, id))}
        width={mm(w)}
        height={mm(h)}
        style={{ position: "absolute", left: 0, top: 0 }}
        alt=""
      />
      {/* body */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          left: mm(pad),
          right: mm(pad),
          top: mm(pad * 0.95),
          height: mm(perf - pad * 1.6),
        }}
      >
        <div style={caps(s(2.5), p.soft, mm)}>{t.stubLabel}</div>
        <div
          style={{
            display: "flex",
            marginTop: mm(s(2.2)),
            fontFamily: "Fraunces",
            fontWeight: 700,
            fontSize: mm(s(8.6)),
            lineHeight: 1.06,
            color: p.ink,
          }}
        >
          {t.headline}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: mm(s(2)),
            fontFamily: "Schibsted",
            fontWeight: 500,
            fontSize: mm(s(3.3)),
            lineHeight: 1.3,
            color: p.soft,
            opacity: 0.9,
          }}
        >
          {t.subline}
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: mm(s(4.5)),
          }}
        >
          {qrPanel(input.qrSvg, Math.min(w * 0.5, s(46)), mm)}
          <Steps steps={t.steps} p={p} size={s(3.1)} mm={mm} />
        </div>
      </div>
      {/* stub */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: mm(pad),
          right: mm(pad),
          top: mm(perf + stub * 0.17),
          bottom: mm(stub * 0.17),
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: mm(w * (t.pin ? 0.5 : 0.56)),
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Fraunces",
              fontWeight: 600,
              fontSize: mm(s(5.6)),
              lineHeight: 1.05,
              color: p.ink,
            }}
          >
            {t.eventName}
          </div>
          <div style={{ ...caps(s(2.4), p.soft, mm), marginTop: mm(s(1.6)) }}>
            {t.date}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: mm(s(1)),
              fontFamily: "Schibsted",
              fontWeight: 500,
              fontSize: mm(s(2.5)),
              color: p.soft,
              opacity: 0.85,
            }}
          >
            {t.noApp}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          {t.pin ? (
            <PinChip text={t} p={p} size={s(2.9)} mm={mm} />
          ) : (
            <div
              style={{
                display: "flex",
                fontFamily: "Fraunces",
                fontWeight: 700,
                fontSize: mm(s(13)),
                lineHeight: 1,
                color: p.outline ? p.accent : p.ink,
                opacity: p.outline ? 0.22 : 0.25,
              }}
            >
              {t.year}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** A landscape ticket for one side of the tent card; stub on the right. */
function LandscapeTicket({
  w,
  h,
  input,
  mm,
  id,
}: {
  w: number;
  h: number;
  input: SheetInput;
  mm: (v: number) => number;
  id: string;
}) {
  const p = palette(input.color, input.paper);
  const t = input.text;
  const stub = w * 0.2;
  const perf = w - stub;
  const pad = h * 0.1;
  const qr = h * 0.5;
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: mm(w),
        height: mm(h),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori */}
      <img
        src={svgUri(ticketSvg(w, h, perf, false, p, id))}
        width={mm(w)}
        height={mm(h)}
        style={{ position: "absolute", left: 0, top: 0 }}
        alt=""
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: mm(pad),
          top: mm(pad),
          bottom: mm(pad),
          width: mm(perf - pad * 1.6),
          alignItems: "center",
          gap: mm(pad * 0.7),
        }}
      >
        {qrPanel(input.qrSvg, qr, mm)}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={caps(2.6, p.soft, mm)}>{t.stubLabel}</div>
          <div
            style={{
              display: "flex",
              marginTop: mm(2.2),
              fontFamily: "Fraunces",
              fontWeight: 700,
              fontSize: mm(8.4),
              lineHeight: 1.04,
              color: p.ink,
            }}
          >
            {t.headline}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: mm(2.2),
              fontFamily: "Schibsted",
              fontWeight: 500,
              fontSize: mm(3.2),
              lineHeight: 1.3,
              color: p.soft,
            }}
          >
            {t.subline}
          </div>
          <div style={{ display: "flex", marginTop: mm(4.5) }}>
            <Steps steps={t.steps} p={p} size={3} mm={mm} />
          </div>
          <div
            style={{
              display: "flex",
              marginTop: mm(3.2),
              fontFamily: "Schibsted",
              fontWeight: 500,
              fontSize: mm(2.5),
              color: p.soft,
              opacity: 0.85,
            }}
          >
            {t.noApp}
          </div>
        </div>
      </div>
      {/* stub */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          left: mm(perf + stub * 0.14),
          right: mm(stub * 0.14),
          top: mm(pad),
          bottom: mm(pad),
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Fraunces",
              fontWeight: 600,
              fontSize: mm(5.2),
              lineHeight: 1.05,
              color: p.ink,
            }}
          >
            {t.eventName}
          </div>
          <div style={{ ...caps(2.3, p.soft, mm), marginTop: mm(1.6) }}>
            {t.date}
          </div>
        </div>
        {t.pin ? (
          <PinChip text={t} p={p} size={2.6} mm={mm} />
        ) : (
          <div
            style={{
              display: "flex",
              fontFamily: "Fraunces",
              fontWeight: 700,
              fontSize: mm(11),
              lineHeight: 1,
              color: p.outline ? p.accent : p.ink,
              opacity: p.outline ? 0.22 : 0.25,
            }}
          >
            {t.year}
          </div>
        )}
      </div>
    </div>
  );
}

/** The whole A4 sheet for `ImageResponse`, `input.width` px wide. */
export function Sheet(input: SheetInput) {
  const k = input.width / A4.w;
  const mm = (v: number) => Math.round(v * k * 100) / 100;
  const t = input.text;
  const guide = "rgba(0,0,0,0.28)";
  const hintStyle = {
    display: "flex" as const,
    position: "absolute" as const,
    padding: `0 ${mm(2)}px`,
    background: "#ffffff",
    fontFamily: "Schibsted",
    fontWeight: 500,
    fontSize: mm(2.6),
    color: "rgba(0,0,0,0.45)",
  };

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
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: mm(10),
            top: mm(10),
          }}
        >
          <PortraitTicket
            w={190}
            h={277}
            scale={2.05}
            input={input}
            mm={mm}
            id="p"
          />
        </div>
      )}

      {input.template === "cards" &&
        [0, 1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              display: "flex",
              position: "absolute",
              left: mm((n % 2) * 105 + 5),
              top: mm(Math.floor(n / 2) * 148.5 + 5.25),
            }}
          >
            <PortraitTicket
              w={95}
              h={138}
              scale={1}
              input={input}
              mm={mm}
              id={`c${n}`}
            />
          </div>
        ))}

      {input.template === "cards" && (
        <>
          <div
            style={{
              display: "flex",
              position: "absolute",
              left: mm(105),
              top: 0,
              height: mm(A4.h),
              borderLeft: `${mm(0.25)}px dashed ${guide}`,
            }}
          />
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: mm(148.5),
              left: 0,
              width: mm(A4.w),
              borderTop: `${mm(0.25)}px dashed ${guide}`,
            }}
          />
          <div
            style={{
              ...hintStyle,
              left: mm(105 + 3),
              top: mm(148.5 - 1.8),
            }}
          >
            {`✂ ${t.cutHint}`}
          </div>
        </>
      )}

      {input.template === "tent" && (
        <>
          {/* The top half is upside down so both sides read once folded. */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              left: mm(8),
              top: mm(8),
              transform: "rotate(180deg)",
            }}
          >
            <LandscapeTicket w={194} h={132.5} input={input} mm={mm} id="t0" />
          </div>
          <div
            style={{
              display: "flex",
              position: "absolute",
              left: mm(8),
              top: mm(148.5 + 8),
            }}
          >
            <LandscapeTicket w={194} h={132.5} input={input} mm={mm} id="t1" />
          </div>
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: mm(148.5),
              left: 0,
              width: mm(A4.w),
              borderTop: `${mm(0.25)}px dashed ${guide}`,
            }}
          />
          <div style={{ ...hintStyle, right: mm(6), top: mm(148.5 - 1.8) }}>
            {t.foldHint}
          </div>
        </>
      )}
    </div>
  );
}

/** One A6 card on its own (the landing page's picture of the templates). */
export function SingleCard(input: SheetInput) {
  const k = input.width / 95;
  const mm = (v: number) => Math.round(v * k * 100) / 100;
  return (
    <div style={{ display: "flex", width: mm(95), height: mm(138) }}>
      <PortraitTicket w={95} h={138} scale={1} input={input} mm={mm} id="s" />
    </div>
  );
}
