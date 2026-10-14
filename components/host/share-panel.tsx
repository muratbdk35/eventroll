"use client";

import { Check, Copy, Download, ExternalLink, Info, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

export function SharePanel({
  eventId,
  eventName,
  link,
  hasPin,
  hasPlan,
  premium,
}: {
  eventId: string;
  eventName: string;
  link: string;
  hasPin: boolean;
  hasPlan: boolean;
  premium: boolean;
}) {
  const t = useTranslations("Events.share");
  const tSteps = useTranslations("Events.steps");
  const [copied, setCopied] = useState(false);
  const qr = `/api/events/${eventId}/qr`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the link stays visible and selectable.
    }
  }

  // No QR or link before a plan is active (the API refuses it too).
  if (!hasPlan) {
    return (
      <section className="flex flex-col items-center rounded-3xl border border-border bg-card px-6 py-12 text-center shadow-sm">
        <span className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
          <Lock className="size-6" aria-hidden />
        </span>
        <h2 className="mt-4 font-heading text-lg font-semibold">
          {t("title")}
        </h2>
        <p className="mt-1 max-w-sm text-sm text-pretty text-muted-foreground">
          {t("locked")}. {t("needsPlan")}
        </p>
        <Button asChild className="mt-5 h-10 rounded-full px-5">
          <Link href={`/dashboard/events/${eventId}`}>{tSteps("plan")}</Link>
        </Button>
      </section>
    );
  }

  const notes = [hasPin && t("pinOn"), !premium && t("printPremium")].filter(
    Boolean,
  ) as string[];

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid md:grid-cols-[17rem_1fr]">
          <div className="flex flex-col items-center gap-4 border-b border-border bg-accent/40 p-6 md:border-e md:border-b-0">
            <div className="rounded-xl border border-border bg-white p-3 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element -- generated per event, authenticated */}
              <img
                src={`${qr}?format=svg`}
                alt={`QR · ${eventName}`}
                width={176}
                height={176}
                className="size-44"
              />
            </div>
            <div className="flex w-full gap-2">
              <Button
                asChild
                variant="outline"
                className="h-9 flex-1 rounded-full px-2"
              >
                <a href={`${qr}?format=png&download`}>
                  <Download aria-hidden />
                  PNG
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-9 flex-1 rounded-full px-2"
              >
                <a href={`${qr}?format=svg&download`}>
                  <Download aria-hidden />
                  SVG
                </a>
              </Button>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <h2 className="font-heading text-lg font-semibold">{t("title")}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("hint")}</p>

            <label
              htmlFor="guest-link"
              className="mt-5 block text-sm font-medium"
            >
              {t("linkLabel")}
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="guest-link"
                readOnly
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-muted/30 px-3 font-mono text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
              <Button
                type="button"
                variant="default"
                className="h-9 rounded-full px-4"
                onClick={copy}
              >
                {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                <span className="hidden sm:inline">
                  {copied ? t("copied") : t("copy")}
                </span>
              </Button>
            </div>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              {t("open")}
            </a>

            {notes.length > 0 && (
              <ul className="mt-5 space-y-2 border-t border-border pt-4 text-[13px] text-muted-foreground">
                {notes.map((n) => (
                  <li key={n} className="flex gap-2">
                    <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h3 className="font-heading text-base font-semibold">
          {t("stepsTitle")}
        </h3>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {[t("step1"), t("step2"), t("step3")].map((text, i) => (
            <li key={text} className="flex gap-3 text-[13px]">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary tabular-nums">
                {i + 1}
              </span>
              <span className="pt-0.5 text-muted-foreground">{text}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
