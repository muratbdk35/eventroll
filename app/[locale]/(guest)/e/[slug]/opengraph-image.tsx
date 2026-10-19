import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { getEventBySlug } from "@/lib/events/queries";
import { TICKET_COLORS, TICKET_THEMES, ticketColor } from "@/lib/events/ticket";
import { routing, type Locale } from "@/lib/i18n/routing";
import { printFonts } from "@/lib/print/fonts";

/*
 * The link preview when a host shares the guest link (WhatsApp, iMessage,
 * Telegram): the event's own ticket on its colour, with the call to action.
 * Drawn with next/og like the print templates (DECISIONS #53).
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "";

const W = 920;
const H = 440;
const STUB = 210;

/** The ticket body: scooped corners and two notches at the perforation. */
function ticketSvg(back: string, front: string, ink: string) {
  const r = 30;
  const n = 26;
  const p = W - STUB;
  const d = [
    `M ${r} 0 L ${p - n} 0 A ${n} ${n} 0 0 0 ${p + n} 0`,
    `L ${W - r} 0 A ${r} ${r} 0 0 0 ${W} ${r}`,
    `L ${W} ${H - r} A ${r} ${r} 0 0 0 ${W - r} ${H}`,
    `L ${p + n} ${H} A ${n} ${n} 0 0 0 ${p - n} ${H}`,
    `L ${r} ${H} A ${r} ${r} 0 0 0 0 ${H - r}`,
    `L 0 ${r} A ${r} ${r} 0 0 0 ${r} 0 Z`,
  ].join(" ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <clipPath id="c"><path d="${d}"/></clipPath>
    <radialGradient id="g" cx="0" cy="0.15" r="0.9">
      <stop offset="0" stop-color="${front}" stop-opacity="0.85"/>
      <stop offset="0.5" stop-color="${front}" stop-opacity="0.25"/>
      <stop offset="1" stop-color="${front}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g clip-path="url(#c)">
    <rect width="${W}" height="${H}" fill="${back}"/>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
  </g>
  <path d="M ${p} ${n + 10} L ${p} ${H - n - 10}" stroke="${ink}" stroke-opacity="0.4" stroke-width="3" stroke-dasharray="12 11" stroke-linecap="round"/>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale: Locale = routing.locales.includes(raw as Locale)
    ? (raw as Locale)
    : routing.defaultLocale;
  const [event, t, te, fonts] = await Promise.all([
    getEventBySlug(slug),
    getTranslations({ locale, namespace: "Guest" }),
    getTranslations({ locale, namespace: "Events" }),
    printFonts(),
  ]);
  const color = ticketColor(event?.ticketColor);
  const c = TICKET_COLORS[color];
  const ground = TICKET_THEMES[color].ground;
  const up = (s: string) => s.toLocaleUpperCase(locale);
  const name = event?.name ?? "EventRoll";
  const nameSize = name.length > 22 ? 64 : name.length > 14 ? 78 : 92;
  const date = event
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "long",
        timeZone: "UTC",
      }).format(new Date(`${event.eventDate}T12:00:00Z`))
    : "";
  const type = event ? te(`types.${event.type as "wedding"}`) : "";

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        background: ground,
      }}
    >
      <div
        style={{
          display: "flex",
          position: "relative",
          width: W,
          height: H,
        }}
      >
        {}
        <img
          src={ticketSvg(c.back, c.front, c.ink)}
          width={W}
          height={H}
          style={{ position: "absolute", left: 0, top: 0 }}
          alt=""
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            left: 64,
            top: 56,
            width: W - STUB - 110,
            height: H - 112,
            color: c.ink,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Schibsted",
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: 4,
            }}
          >
            {up(type)}
          </div>
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              fontFamily: "Fraunces",
              fontWeight: 600,
              fontSize: nameSize,
              lineHeight: 1.04,
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Schibsted",
                fontWeight: 700,
                fontSize: 24,
                letterSpacing: 3,
              }}
            >
              {up(date)}
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Fraunces",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 34,
              }}
            >
              {t("ogCta")}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: W - STUB,
            top: 0,
            width: STUB,
            height: H,
            alignItems: "center",
            justifyContent: "center",
            color: c.ink,
            fontFamily: "Schibsted",
            fontWeight: 700,
            fontSize: 40,
            letterSpacing: 6,
          }}
        >
          <div style={{ display: "flex", transform: "rotate(90deg)" }}>
            {up(t("ticketStub"))}
          </div>
        </div>
      </div>
    </div>,
    { ...size, fonts },
  );
}
