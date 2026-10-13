"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
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
      if (res.ok) router.push(`/dashboard/events/${res.id}`);
      else setError(true);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input
          id="name"
          required
          maxLength={80}
          autoFocus
          placeholder={t("namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 rounded-xl"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date">{t("dateLabel")}</Label>
        <Input
          id="date"
          type="date"
          required
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="h-11 rounded-xl"
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("typeLabel")}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EVENT_TYPES.map((value) => (
            <label
              key={value}
              className={cn(
                "flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-card px-3 text-sm font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                type === value &&
                  "border-primary bg-accent text-accent-foreground",
              )}
            >
              <input
                type="radio"
                name="type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
                className="sr-only"
              />
              {t(`types.${value}`)}
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {t("createError")}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full rounded-xl"
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
  );
}
