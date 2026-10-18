import { ImageResponse } from "next/og";
import { createTranslator } from "next-intl";
import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOwnedEvent } from "@/lib/events/queries";
import { isTicketColor, ticketColor } from "@/lib/events/ticket";
import { guestUrl } from "@/lib/events/urls";
import { routing, type Locale } from "@/lib/i18n/routing";
import { printFonts } from "@/lib/print/fonts";
import { plans } from "@/lib/plans";
import { A4, Sheet, type TemplateId } from "@/lib/print/sheet";

type Ctx = { params: Promise<{ id: string }> };

// A 300 dpi sheet takes a few seconds to rasterise.
export const maxDuration = 60;

const TEMPLATES: TemplateId[] = ["cards", "tent", "poster"];
/** A4 at 300 dpi for the download; previews ask for less. */
const PRINT_WIDTH = 2480;

/**
 * GET /api/events/:id/template?t=cards|tent|poster&c=<ticket colour>&paper=1
 *   &h=<headline>&pin=1&locale=tr&w=<px>&download
 * The template as a PNG (DECISIONS #51). Owner only, published events only.
 * Without Pro or VIP the image carries a "PRO" watermark and can't be
 * downloaded.
 */
export async function GET(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const event = await getOwnedEvent((await params).id, session.user.id);
  if (!event) return new NextResponse(null, { status: 404 });
  if (!event.plan) return new NextResponse(null, { status: 402 });
  if (event.status !== "active") return new NextResponse(null, { status: 409 });

  const q = new URL(req.url).searchParams;
  const included = plans[event.plan].printTemplates;
  const download = q.has("download");
  if (download && !included) return new NextResponse(null, { status: 403 });

  const template = TEMPLATES.find((x) => x === q.get("t")) ?? "cards";
  const color = isTicketColor(q.get("c"))
    ? ticketColor(q.get("c"))
    : ticketColor(event.ticketColor);
  const locale: Locale = routing.locales.includes(q.get("locale") as Locale)
    ? (q.get("locale") as Locale)
    : routing.defaultLocale;
  const width = download
    ? PRINT_WIDTH
    : Math.min(PRINT_WIDTH, Math.max(300, Number(q.get("w")) || 900));

  const messages = (await import(`../../../../../messages/${locale}.json`))
    .default;
  const t = createTranslator({ locale, messages, namespace: "Events.print" });
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${event.eventDate}T12:00:00Z`));
  const headline =
    (q.get("h") ?? "").trim().slice(0, 60) || t("headlineDefault");
  const pin =
    q.get("pin") === "1" && event.accessPin ? event.accessPin : undefined;

  const qrSvg = await QRCode.toString(guestUrl(event), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#141b26", light: "#ffffff" },
  });

  const sheet = Sheet({
    template,
    color,
    paper: q.get("paper") === "1",
    qrSvg,
    width,
    text: {
      eventName: event.name,
      date: date.toLocaleUpperCase(locale),
      label: t("label").toLocaleUpperCase(locale),
      headline,
      subline: t("subline"),
      noApp: t("noApp"),
      cutHint: t("cutHint"),
      foldHint: t("foldHint"),
      pin,
      pinLabel: "PIN",
    },
  });

  const height = Math.round((width / A4.w) * A4.h);
  const element = included ? (
    sheet
  ) : (
    <div style={{ display: "flex", position: "relative" }}>
      {sheet}
      {/* A screenshot of the preview is not a print. */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          flexWrap: "wrap",
          alignContent: "space-around",
          justifyContent: "space-around",
          transform: "rotate(-28deg) scale(1.4)",
        }}
      >
        {Array.from({ length: 24 }, (_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              width: width / 3,
              justifyContent: "center",
              fontFamily: "Schibsted",
              fontWeight: 700,
              fontSize: width / 22,
              letterSpacing: width / 120,
              color: "rgba(20,30,45,0.16)",
            }}
          >
            PRO
          </div>
        ))}
      </div>
    </div>
  );

  const slug = { cards: "table-cards", tent: "tent-card", poster: "poster" }[
    template
  ];
  return new ImageResponse(element, {
    width,
    height,
    fonts: await printFonts(),
    headers: {
      "Cache-Control": "private, no-store",
      ...(download
        ? {
            "Content-Disposition": `attachment; filename="${event.slug}-${slug}.png"`,
          }
        : {}),
    },
  });
}
