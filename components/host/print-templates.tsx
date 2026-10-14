"use client";

import {
  Download,
  LayoutGrid,
  Loader2,
  Lock,
  Printer,
  RectangleVertical,
  Sparkles,
  Tent,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore, useTransition } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { devActivate } from "@/lib/events/actions";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Printable QR templates (Premium, DECISIONS #22 and #31). Every sheet is A4
 * in millimetres; the face scales with container query units so one design
 * serves the A6 card, the half-A4 tent card and the A4 poster. Printing uses
 * the browser dialog, which also saves as PDF. No EventRoll branding on
 * printed material (DECISIONS #21).
 */

const noop = () => () => {};

type TemplateId = "cards" | "tent" | "poster";
type ColorId = "terracotta" | "midnight" | "sage" | "blush";

const palettes: Record<
  ColorId,
  { bg: string; ink: string; accent: string; soft: string }
> = {
  terracotta: {
    bg: "#f7efe5",
    ink: "#2b211c",
    accent: "#c4623a",
    soft: "#ecd9c6",
  },
  midnight: {
    bg: "#1d2331",
    ink: "#f6efe6",
    accent: "#e9b07a",
    soft: "#2c3446",
  },
  sage: { bg: "#eef0e5", ink: "#26311f", accent: "#647f50", soft: "#d9dfc8" },
  blush: { bg: "#f9e9e5", ink: "#3b2327", accent: "#c0657a", soft: "#efd0cb" },
};

const templateIcons = {
  cards: LayoutGrid,
  tent: Tent,
  poster: RectangleVertical,
} as const;

type FaceText = {
  eventName: string;
  date: string;
  headline: string;
  subline: string;
  steps: string;
  noApp: string;
  pinNote?: string;
};

/** One printed face. Sizes are in cqw so it scales with its box. */
function Face({
  qr,
  color,
  text,
  layout,
}: {
  qr: string;
  color: ColorId;
  text: FaceText;
  layout: "column" | "row";
}) {
  const p = palettes[color];
  const row = layout === "row";
  return (
    <div
      className="relative size-full overflow-hidden"
      style={{ containerType: "size", background: p.bg, color: p.ink }}
    >
      {/* soft decorative blobs */}
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{
          width: "70cqw",
          height: "70cqw",
          top: "-30cqw",
          insetInlineEnd: "-28cqw",
          background: p.soft,
        }}
      />
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{
          width: "46cqw",
          height: "46cqw",
          bottom: "-22cqw",
          insetInlineStart: "-18cqw",
          background: p.soft,
        }}
      />
      {/* inset frame */}
      <span
        aria-hidden
        className="absolute"
        style={{
          inset: "3.2cqw",
          border: `0.35cqw solid ${p.accent}`,
          borderRadius: "3cqw",
          opacity: 0.55,
        }}
      />

      <div
        className={cn(
          "relative flex size-full items-center text-center",
          row ? "flex-row gap-[6cqw] px-[9cqw]" : "flex-col justify-center",
        )}
        style={row ? undefined : { padding: "9cqw", gap: "3.2cqh" }}
      >
        <div
          className={cn(
            "flex flex-col items-center",
            row && "order-2 flex-1 items-start text-start",
          )}
          style={{ gap: row ? "1.6cqw" : "1.4cqh" }}
        >
          <p
            className="font-semibold uppercase"
            style={{
              fontSize: row ? "2.4cqw" : "3.3cqw",
              letterSpacing: "0.22em",
              color: p.accent,
            }}
          >
            {text.eventName}
            {text.date &&
              (row ? (
                <span className="block" style={{ opacity: 0.75 }}>
                  {text.date}
                </span>
              ) : (
                <span style={{ opacity: 0.75 }}> · {text.date}</span>
              ))}
          </p>
          <p
            className="font-heading font-bold text-balance"
            style={{
              fontSize: row ? "5.6cqw" : "8.6cqw",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
            }}
          >
            {text.headline}
          </p>
          {row && (
            <p style={{ fontSize: "2.5cqw", opacity: 0.75 }}>{text.subline}</p>
          )}
          {row && (
            <p
              className="font-semibold"
              style={{
                fontSize: "2cqw",
                letterSpacing: "0.2em",
                color: p.accent,
                marginTop: "1cqw",
              }}
            >
              {text.steps}
            </p>
          )}
        </div>

        <div
          className={cn("shrink-0", row && "order-1")}
          style={{
            width: row ? "36cqw" : "52cqw",
            background: "#fff",
            padding: row ? "2.2cqw" : "3.2cqw",
            borderRadius: row ? "3cqw" : "4.5cqw",
            boxShadow: "0 1.5cqw 4cqw -1.5cqw rgb(0 0 0 / 0.25)",
            transform: "rotate(-1.5deg)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- generated per event, authenticated */}
          <img src={qr} alt="" className="block aspect-square w-full" />
        </div>

        {!row && (
          <div className="flex flex-col items-center" style={{ gap: "1.2cqh" }}>
            <p style={{ fontSize: "3.8cqw", opacity: 0.8 }}>{text.subline}</p>
            <p
              className="font-semibold"
              style={{
                fontSize: "2.9cqw",
                letterSpacing: "0.22em",
                color: p.accent,
              }}
            >
              {text.steps}
            </p>
            <p style={{ fontSize: "2.6cqw", opacity: 0.6 }}>
              {text.pinNote ?? text.noApp}
            </p>
          </div>
        )}
        {row && text.pinNote && (
          <p
            className="absolute"
            style={{
              bottom: "6cqw",
              insetInlineEnd: "9cqw",
              fontSize: "1.9cqw",
              opacity: 0.6,
            }}
          >
            {text.pinNote}
          </p>
        )}
      </div>
    </div>
  );
}

/** A full A4 sheet for the chosen template. */
function Sheet({
  template,
  qr,
  color,
  text,
  hints,
}: {
  template: TemplateId;
  qr: string;
  color: ColorId;
  text: FaceText;
  hints: { cut: string; fold: string };
}) {
  const face = (layout: "column" | "row") => (
    <Face qr={qr} color={color} text={text} layout={layout} />
  );
  return (
    <div
      className="relative overflow-hidden bg-white"
      style={{
        width: "210mm",
        height: "297mm",
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      }}
    >
      {template === "poster" && face("column")}

      {template === "cards" && (
        <>
          <div className="grid size-full grid-cols-2 grid-rows-2">
            {[0, 1, 2, 3].map((n) => (
              <div key={n} style={{ padding: "4mm" }}>
                <div className="size-full overflow-hidden rounded-[3mm]">
                  {face("column")}
                </div>
              </div>
            ))}
          </div>
          {/* cut guides */}
          <span
            aria-hidden
            className="absolute inset-y-0 start-1/2 border-s border-dashed border-black/30"
          />
          <span
            aria-hidden
            className="absolute inset-x-0 top-1/2 border-t border-dashed border-black/30"
          />
          <span className="absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-[2mm] text-[2.4mm] whitespace-nowrap text-black/45 rtl:translate-x-1/2">
            ✂ {hints.cut}
          </span>
        </>
      )}

      {template === "tent" && (
        <div className="flex size-full flex-col">
          {/* Top half is upside down so both sides read correctly once folded. */}
          <div className="h-1/2 rotate-180">{face("row")}</div>
          <div className="h-1/2">{face("row")}</div>
          <span
            aria-hidden
            className="absolute inset-x-0 top-1/2 border-t border-dashed border-black/35"
          />
          <span className="absolute end-[6mm] top-1/2 -translate-y-1/2 bg-white px-[2mm] text-[2.4mm] text-black/45">
            {hints.fold}
          </span>
        </div>
      )}
    </div>
  );
}

export function PrintTemplates({
  eventId,
  eventName,
  date,
  hasPin,
  premium,
  devMode,
}: {
  eventId: string;
  eventName: string;
  date: string;
  hasPin: boolean;
  premium: boolean;
  devMode: boolean;
}) {
  const t = useTranslations("Events.print");
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateId>("cards");
  const [color, setColor] = useState<ColorId>("terracotta");
  const [headline, setHeadline] = useState(() => t("headlineDefault"));
  const [upgrading, startUpgrade] = useTransition();
  const qr = `/api/events/${eventId}/qr?format=svg`;

  // The print copy is portalled straight under <body> so print CSS can hide
  // everything else without fighting the dashboard layout.
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  const text: FaceText = {
    eventName,
    date,
    headline: headline.trim() || t("headlineDefault"),
    subline: t("subline"),
    steps: t("steps"),
    noApp: t("noApp"),
    pinNote: hasPin ? t("pinNote") : undefined,
  };
  const hints = { cut: t("cutHint"), fold: t("foldHint") };
  const sheet = (
    <Sheet
      template={template}
      qr={qr}
      color={color}
      text={text}
      hints={hints}
    />
  );

  const templates: TemplateId[] = ["cards", "tent", "poster"];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
      <style>{`
        #print-root { display: none; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { background: #fff !important; margin: 0 !important; }
          body > *:not(#print-root) { display: none !important; }
          #print-root { display: block !important; }
        }
      `}</style>

      {/* Controls */}
      <div className="space-y-6">
        <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
          {templates.map((id) => {
            const Icon = templateIcons[id];
            const active = template === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setTemplate(id)}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-3.5 text-start transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  active
                    ? "border-primary/40 bg-accent/60 shadow-sm ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-primary/25",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {t(`templates.${id}`)}
                  </span>
                  <span className="block text-[13px] text-pretty text-muted-foreground">
                    {t(`templates.${id}Hint`)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <p className="mb-2.5 text-sm font-medium">{t("colorLabel")}</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(palettes) as ColorId[]).map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={color === id}
                onClick={() => setColor(id)}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full border bg-card ps-1.5 pe-3.5 text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  color === id
                    ? "border-primary/40 font-semibold ring-1 ring-primary/25"
                    : "border-border hover:border-primary/25",
                )}
              >
                <span
                  className="size-6 rounded-full ring-1 ring-black/10"
                  style={{
                    background: `linear-gradient(135deg, ${palettes[id].bg} 50%, ${palettes[id].accent} 50%)`,
                  }}
                />
                {t(`colors.${id}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="print-headline"
            className="mb-2 block text-sm font-medium"
          >
            {t("headlineLabel")}
          </label>
          <input
            id="print-headline"
            value={headline}
            maxLength={60}
            onChange={(e) => setHeadline(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-card px-3.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>

        <div className="space-y-2">
          <Button
            className="h-11 w-full rounded-full text-[15px] shadow-[0_10px_24px_-10px_var(--primary)]"
            disabled={!premium}
            onClick={() => window.print()}
          >
            <Printer aria-hidden />
            {t("printButton")}
          </Button>
          <p className="text-center text-xs text-pretty text-muted-foreground">
            {t("printHint")}
          </p>
        </div>
      </div>

      {/* Preview: the real sheet, zoomed down on screen. */}
      <div className="relative flex items-start justify-center">
        <div
          className={cn(
            "[zoom:0.4] overflow-hidden rounded-md shadow-[0_30px_60px_-30px_rgb(60_30_10/0.5)] ring-1 ring-black/10 sm:[zoom:0.5]",
            !premium && "pointer-events-none blur-[3px] select-none",
          )}
          aria-hidden
        >
          {sheet}
        </div>
        {!premium && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="max-w-xs rounded-3xl border border-white/70 bg-card/90 p-5 text-center shadow-2xl backdrop-blur-md">
              <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-accent text-primary">
                <Lock className="size-5" aria-hidden />
              </span>
              <p className="mt-3 font-heading text-base font-semibold">
                {t("premiumTitle")}
              </p>
              <p className="mt-1 text-sm text-pretty text-muted-foreground">
                {t("premiumBody")}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="h-9 rounded-full px-3.5"
                >
                  <a href={`/api/events/${eventId}/qr?format=png&download`}>
                    <Download aria-hidden />
                    PNG
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-9 rounded-full px-3.5"
                >
                  <a href={`/api/events/${eventId}/qr?format=svg&download`}>
                    <Download aria-hidden />
                    SVG
                  </a>
                </Button>
              </div>
              {devMode && (
                <Button
                  className="mt-2 h-9 w-full rounded-full"
                  disabled={upgrading}
                  onClick={() =>
                    startUpgrade(async () => {
                      await devActivate(eventId, "premium");
                      router.refresh();
                    })
                  }
                >
                  {upgrading ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Sparkles aria-hidden />
                  )}
                  Premium (dev)
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {mounted &&
        premium &&
        createPortal(<div id="print-root">{sheet}</div>, document.body)}
    </div>
  );
}
