"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { eventVisuals } from "@/components/host/event-visuals";
import { Button } from "@/components/ui/button";
import { DateTimeField } from "@/components/ui/date-time-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEvent } from "@/lib/events/actions";
import { EVENT_TYPES } from "@/lib/events/schemas";
import { adjustEnd, clampEnd, maxEnd } from "@/lib/events/times";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

function localInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Default: today 19:00 (or the next full hour if later) for five hours. */
function defaultTimes(): [string, string] {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  if (start.getHours() < 19) start.setHours(19);
  else start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 5 * 3_600_000);
  return [localInput(start), localInput(end)];
}

export function CreateEventForm() {
  const t = useTranslations("Events");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  const [name, setName] = useState("");
  const [startLocal, setStartLocal] = useState(() => defaultTimes()[0]);
  const [endLocal, setEndLocal] = useState(() => defaultTimes()[1]);
  const rangeOk = new Date(endLocal) > new Date(startLocal);
  const [type, setType] = useState<(typeof EVENT_TYPES)[number]>("wedding");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    start(async () => {
      const res = await createEvent({
        name,
        type,
        startsAt: new Date(startLocal).toISOString(),
        endsAt: new Date(endLocal).toISOString(),
        eventDate: startLocal.slice(0, 10),
      });
      if (res.ok) router.push(`/dashboard/events/${res.id}`);
      else setError(true);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="space-y-6 p-5 sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="name">{t("nameLabel")}</Label>
          <Input
            id="name"
            required
            maxLength={80}
            autoFocus
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 text-base"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="starts">{t("startLabel")}</Label>
            <DateTimeField
              id="starts"
              value={startLocal}
              onChange={(v) => {
                setStartLocal(v);
                setEndLocal((end) => adjustEnd(v, end));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ends">{t("endLabel")}</Label>
            <DateTimeField
              id="ends"
              value={endLocal}
              min={startLocal}
              max={maxEnd(startLocal)}
              onChange={(v) => setEndLocal(clampEnd(startLocal, v))}
              invalid={!rangeOk}
            />
          </div>
          {!rangeOk && (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {t("dateRangeError")}
            </p>
          )}
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm leading-none font-medium">
            {t("typeLabel")}
          </legend>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((value) => {
              const { Icon } = eventVisuals[value];
              const selected = type === value;
              return (
                <label
                  key={value}
                  className={cn(
                    "flex h-11 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring/50",
                    selected
                      ? "border-primary bg-accent text-accent-foreground shadow-[inset_0_0_0_1px_var(--primary)]"
                      : "border-border text-foreground/80 hover:bg-muted/50",
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
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      selected ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                  <span className="whitespace-nowrap">
                    {t(`types.${value}`)}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p
            className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {t("createError")}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/40 px-5 py-4 sm:px-6">
        <Button asChild variant="ghost" className="h-10 rounded-full px-4">
          <Link href="/dashboard">{t("cancel")}</Link>
        </Button>
        <Button
          type="submit"
          className="h-10 rounded-full px-5"
          disabled={pending || !name.trim() || !rangeOk}
        >
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {pending ? t("creating") : t("create")}
        </Button>
      </div>
    </form>
  );
}
