"use client";

import { Camera, Check, Loader2, Lock } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { eventVisuals } from "@/components/host/event-visuals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEvent } from "@/lib/events/actions";
import { EVENT_TYPES } from "@/lib/events/schemas";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function CreateEventForm() {
  const t = useTranslations("Events");
  const tg = useTranslations("Guest");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState(today);
  const [type, setType] = useState<(typeof EVENT_TYPES)[number]>("wedding");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    start(async () => {
      const res = await createEvent({ name, eventDate, type });
      if (res.ok) router.push(`/dashboard/events/${res.id}?tab=share`);
      else setError(true);
    });
  }

  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
      <form
        onSubmit={onSubmit}
        className="space-y-7 rounded-3xl border border-border bg-card p-6 shadow-[0_1px_2px_rgb(60_30_10/0.04)] sm:p-8"
      >
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold">
            {t("nameLabel")}
          </Label>
          <Input
            id="name"
            required
            maxLength={80}
            autoFocus
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-xl text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-semibold">
            {t("dateLabel")}
          </Label>
          <Input
            id="date"
            type="date"
            required
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="h-12 rounded-xl text-base sm:max-w-60"
          />
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">{t("typeLabel")}</legend>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {EVENT_TYPES.map((value) => {
              const { Icon } = eventVisuals[value];
              const selected = type === value;
              return (
                <label
                  key={value}
                  className={cn(
                    "relative flex cursor-pointer flex-col items-start gap-3 rounded-2xl border bg-background p-3.5 text-sm font-medium transition-all has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                    selected
                      ? "border-primary bg-accent/60 shadow-[0_0_0_1px_var(--primary)]"
                      : "border-border hover:border-foreground/20 hover:bg-muted/50",
                  )}
                >
                  <input
                    type="radio"
                    name="type"
                    value={value}
                    checked={selected}
                    onChange={() => setType(value)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  {t(`types.${value}`)}
                  {selected && (
                    <Check
                      className="absolute end-3 top-3 size-4 text-primary"
                      aria-hidden
                    />
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p
            className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {t("createError")}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full rounded-xl text-base"
          disabled={pending || !name.trim()}
        >
          {pending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              {t("creating")}
            </>
          ) : (
            t("create")
          )}
        </Button>
      </form>

      <aside className="space-y-6 lg:sticky lg:top-6">
        <div>
          <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t("preview")}
          </p>
          {/* Miniature of the real guest page (app/[locale]/(guest)/e/[slug]). */}
          <div
            aria-hidden
            className="mx-auto w-full max-w-[17rem] rounded-[2.25rem] bg-foreground p-2 shadow-[0_30px_60px_-30px_rgb(60_30_10/0.6)]"
          >
            <div className="overflow-hidden rounded-[1.75rem] bg-background">
              <div className="relative h-28">
                <Image
                  src={eventVisuals[type].cover}
                  alt=""
                  fill
                  sizes="272px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/5" />
                <div className="absolute inset-x-3 bottom-2.5 text-white">
                  <p className="text-[9px] font-medium tracking-wider uppercase opacity-80">
                    {tg("for")}
                  </p>
                  <p className="truncate font-heading text-base leading-tight font-bold">
                    {name.trim() || t("previewName")}
                  </p>
                </div>
              </div>
              <div className="space-y-2.5 p-3">
                <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-primary px-3 py-5 text-primary-foreground">
                  <Camera className="size-5" />
                  <span className="rounded-lg bg-white px-3 py-1 text-[11px] font-semibold text-primary">
                    {tg("choose")}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    "/marketing/toast.jpg",
                    "/marketing/rings.jpg",
                    "/marketing/cake.jpg",
                  ].map((src) => (
                    <div
                      key={src}
                      className="relative aspect-square overflow-hidden rounded-md"
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                <p className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
                  <Lock className="size-2.5" />
                  {tg("formats")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-heading text-sm font-semibold">
            {t("next.title")}
          </p>
          <ol className="mt-3 space-y-2.5 text-sm text-muted-foreground">
            {(["one", "two", "three"] as const).map((k, i) => (
              <li key={k} className="flex gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                  {i + 1}
                </span>
                {t(`next.${k}`)}
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}
