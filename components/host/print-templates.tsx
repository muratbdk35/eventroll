"use client";

import {
  Check,
  Download,
  KeyRound,
  LayoutGrid,
  Loader2,
  Lock,
  RectangleVertical,
  Sparkles,
  Tent,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { devActivate } from "@/lib/events/actions";
import {
  TICKET_COLORS,
  ticketColors,
  type TicketColor,
} from "@/lib/events/ticket";
import { useRouter } from "@/lib/i18n/navigation";
import type { TemplateId } from "@/lib/print/sheet";
import { cn } from "@/lib/utils";

/**
 * QR templates (Premium, DECISIONS #22, #31, #51): pick a template, a ticket
 * colour (or the white, ink-friendly version), a headline and whether the PIN
 * shows. The server draws the sheet (/api/events/:id/template), so the
 * preview here is the very PNG that downloads, at 300 dpi. Standard sees the
 * same preview with a "PREMIUM" watermark and can download the bare QR.
 */

const templateIcons = {
  cards: LayoutGrid,
  tent: Tent,
  poster: RectangleVertical,
} as const;
const templates: TemplateId[] = ["cards", "tent", "poster"];

export function PrintTemplates({
  eventId,
  initialColor,
  hasPin,
  pin,
  premium,
  devMode,
}: {
  eventId: string;
  /** The guest ticket's colour, so the cards match the guest page. */
  initialColor: TicketColor;
  hasPin: boolean;
  /** Readable PIN, null for PINs set before it was stored. */
  pin: string | null;
  premium: boolean;
  devMode: boolean;
}) {
  const t = useTranslations("Events.print");
  const tc = useTranslations("Events.ticket.colors");
  const locale = useLocale();
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateId>("cards");
  const [color, setColor] = useState<TicketColor>(initialColor);
  const [paper, setPaper] = useState(false);
  const [headline, setHeadline] = useState(() => t("headlineDefault"));
  // The preview re-renders on the server: wait for a pause in typing.
  const [typed, setTyped] = useState(headline);
  const [showPin, setShowPin] = useState(Boolean(pin));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [upgrading, startUpgrade] = useTransition();

  useEffect(() => {
    const id = setTimeout(() => setTyped(headline), 450);
    return () => clearTimeout(id);
  }, [headline]);

  const q = new URLSearchParams({
    t: template,
    c: color,
    locale,
    h: typed.trim() || t("headlineDefault"),
  });
  if (paper) q.set("paper", "1");
  if (showPin && pin) q.set("pin", "1");
  const base = `/api/events/${eventId}/template?${q}`;
  const preview = `${base}&w=1000`;

  // The 300 dpi sheet takes a few seconds on the server: fetch it with a
  // spinner on the button, then hand the browser the file.
  async function download() {
    setSaving(true);
    try {
      const res = await fetch(`${base}&download`);
      if (!res.ok) throw new Error(String(res.status));
      const name =
        /filename="([^"]+)"/.exec(
          res.headers.get("content-disposition") ?? "",
        )?.[1] ?? "qr.png";
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      toast.error(t("downloadFailed"));
    } finally {
      setSaving(false);
    }
  }

  // A new picture is on its way whenever the address changes.
  const [shown, setShown] = useState(preview);
  if (shown !== preview) {
    setShown(preview);
    setLoading(true);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
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

        <fieldset>
          <legend className="mb-2.5 text-sm font-medium">
            {t("colorLabel")}
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {ticketColors.map((id) => {
              const c = TICKET_COLORS[id];
              const on = color === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  aria-label={tc(id)}
                  title={tc(id)}
                  onClick={() => setColor(id)}
                  className={cn(
                    "relative flex size-10 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on && "ring-2 ring-foreground",
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${c.back} 50%, ${c.front} 50%)`,
                  }}
                >
                  {on && (
                    <Check
                      className="size-4"
                      style={{ color: c.ink }}
                      strokeWidth={3}
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5">
          <div className="min-w-0 flex-1">
            <label htmlFor="print-paper" className="block text-sm font-medium">
              {t("paperLabel")}
            </label>
            <p className="mt-0.5 text-[13px] text-pretty text-muted-foreground">
              {t("paperHint")}
            </p>
          </div>
          <Switch id="print-paper" checked={paper} onCheckedChange={setPaper} />
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

        {hasPin && (
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5">
            <KeyRound
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <label
                htmlFor="print-show-pin"
                className="block text-sm font-medium"
              >
                {t("showPin")}
              </label>
              <p className="mt-0.5 text-[13px] text-pretty text-muted-foreground">
                {pin ? t("showPinHint") : t("showPinResave")}
              </p>
            </div>
            <Switch
              id="print-show-pin"
              checked={showPin && Boolean(pin)}
              disabled={!pin}
              onCheckedChange={setShowPin}
            />
          </div>
        )}
      </div>

      {/* Preview: the PNG itself, then the way out. */}
      <div className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <div className="relative overflow-hidden rounded-lg bg-white shadow-[0_30px_60px_-30px_rgb(20_35_60/0.45)] ring-1 ring-black/10">
          {/* eslint-disable-next-line @next/next/no-img-element -- generated per request, authenticated */}
          <img
            src={preview}
            alt={t("previewAlt", { template: t(`templates.${template}`) })}
            width={1000}
            height={1414}
            className={cn(
              "block aspect-[210/297] w-full transition-opacity duration-200",
              loading && "opacity-60",
            )}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2
                className="size-6 animate-spin text-muted-foreground"
                aria-hidden
              />
            </span>
          )}
        </div>

        {premium ? (
          <>
            <Button
              className="h-11 w-full rounded-full text-[15px] shadow-[0_10px_24px_-10px_var(--primary)]"
              disabled={saving}
              onClick={download}
            >
              {saving ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Download aria-hidden />
              )}
              {saving ? t("downloadPreparing") : t("downloadPng")}
            </Button>
            <p className="text-center text-xs text-pretty text-muted-foreground">
              {t("downloadHint")}
            </p>
          </>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-accent text-primary">
              <Lock className="size-4.5" aria-hidden />
            </span>
            <p className="mt-2.5 font-heading text-base font-semibold">
              {t("premiumTitle")}
            </p>
            <p className="mt-1 text-sm text-pretty text-muted-foreground">
              {t("premiumBody")}
            </p>
            <div className="mt-3.5 flex justify-center gap-2">
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
        )}
      </div>
    </div>
  );
}
