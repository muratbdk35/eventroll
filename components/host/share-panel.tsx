"use client";

import { Check, Copy, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SharePanel({
  eventId,
  link,
  hasPin,
  hasPlan,
}: {
  eventId: string;
  link: string;
  hasPin: boolean;
  hasPlan: boolean;
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

  return (
    <section className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start">
      <div className="mx-auto w-full max-w-[17rem] rounded-3xl border border-border bg-white p-3 shadow-sm md:mx-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated per-event, authenticated */}
        <img
          src={`${qr}?format=svg`}
          alt=""
          width={256}
          height={256}
          className="aspect-square w-full"
        />
      </div>

      <div className="space-y-5">
        <div>
          <h2 className="font-heading text-xl font-semibold">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("hint")}</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="guest-link" className="text-sm font-medium">
            {t("linkLabel")}
          </label>
          <div className="flex gap-2">
            <input
              id="guest-link"
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-card px-3 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl px-4"
              onClick={copy}
            >
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied ? t("copied") : t("copy")}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
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
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          {hasPin && <p>{t("pinOn")}</p>}
          {!hasPlan && <p>{t("needsPlan")}</p>}
        </div>
      </div>
    </section>
  );
}
