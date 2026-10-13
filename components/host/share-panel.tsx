"use client";

import {
  Camera,
  Check,
  Copy,
  Download,
  ExternalLink,
  Images,
  Info,
  ScanLine,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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

  const steps = [
    { Icon: ScanLine, text: t("step1") },
    { Icon: Images, text: t("step2") },
    { Icon: Camera, text: t("step3") },
  ];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      {/* Printed table-card look, matching the landing page (DECISIONS #22). */}
      <div className="flex justify-center rounded-[2rem] bg-secondary px-6 py-10">
        <div className="w-full max-w-[15rem] rounded-3xl bg-[#fffaf4] p-6 text-center shadow-[0_28px_60px_-24px_rgb(60_30_10/0.55)] ring-1 ring-black/5">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[#8a6f62] uppercase">
            {t("cardTitle")}
          </p>
          <p className="mt-1 font-heading text-lg leading-tight font-bold text-balance text-[#2b211c]">
            {eventName}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- generated per event, authenticated */}
          <img
            src={`${qr}?format=svg`}
            alt=""
            width={192}
            height={192}
            className="mx-auto mt-4 aspect-square w-full max-w-44 mix-blend-multiply"
          />
          {hasPin && (
            <p className="mt-3 inline-block rounded-md bg-[#2b211c] px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.15em] text-white">
              {t("cardPin")}
            </p>
          )}
          <p className="mt-3 text-[10px] font-semibold tracking-[0.12em] text-[#8a6f62] uppercase">
            {t("cardHint")}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-heading text-xl font-semibold">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("hint")}</p>

          <label
            htmlFor="guest-link"
            className="mt-5 block text-sm font-semibold"
          >
            {t("linkLabel")}
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="guest-link"
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-muted/50 px-3.5 font-mono text-sm"
            />
            <Button
              type="button"
              className="h-11 rounded-xl px-4"
              onClick={copy}
            >
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied ? t("copied") : t("copy")}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="h-10 rounded-xl">
              <a href={`${qr}?format=png&download`}>
                <Download aria-hidden />
                {t("png")}
              </a>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-xl">
              <a href={`${qr}?format=svg&download`}>
                <Download aria-hidden />
                {t("svg")}
              </a>
            </Button>
            <Button asChild variant="ghost" className="h-10 rounded-xl">
              <a href={link} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden />
                {t("open")}
              </a>
            </Button>
          </div>

          {(!hasPlan || hasPin || !premium) && (
            <ul className="mt-5 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
              {!hasPlan && (
                <li className="flex gap-2">
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-amber-600"
                    aria-hidden
                  />
                  {t("needsPlan")}
                </li>
              )}
              {hasPin && (
                <li className="flex gap-2">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {t("pinOn")}
                </li>
              )}
              {!premium && (
                <li className="flex gap-2">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {t("printPremium")}
                </li>
              )}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-card p-6">
          <h3 className="font-heading text-base font-semibold">
            {t("stepsTitle")}
          </h3>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {steps.map(({ Icon, text }, i) => (
              <li key={text} className="rounded-2xl bg-muted/60 p-4">
                <span className="flex size-9 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <p className="mt-3 text-sm">
                  <span className="font-semibold text-muted-foreground tabular-nums">
                    {i + 1}.{" "}
                  </span>
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
