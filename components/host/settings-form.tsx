"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteEvent, updateSettings } from "@/lib/events/actions";
import { useRouter } from "@/lib/i18n/navigation";

type Props = {
  eventId: string;
  initial: {
    name: string;
    requireName: boolean;
    hasPin: boolean;
    uploadOpensAt: string | null;
    uploadClosesAt: string | null;
    maxUploadsPerDevice: number | null;
  };
};

/** ISO instant -> value for <input type="datetime-local"> in the viewer's zone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(local: string): string | null {
  return local ? new Date(local).toISOString() : null;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-heading text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function SettingsForm({ eventId, initial }: Props) {
  const t = useTranslations("Events.settings");
  const tEvents = useTranslations("Events");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState(initial.name);
  const [requireName, setRequireName] = useState(initial.requireName);
  const [pin, setPin] = useState("");
  const [removePin, setRemovePin] = useState(false);
  const [opens, setOpens] = useState(toLocalInput(initial.uploadOpensAt));
  const [closes, setCloses] = useState(toLocalInput(initial.uploadClosesAt));
  const [perPhone, setPerPhone] = useState(
    initial.maxUploadsPerDevice?.toString() ?? "",
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await updateSettings(eventId, {
        name,
        requireName,
        pin: pin ? pin : removePin ? null : undefined,
        uploadOpensAt: toIso(opens),
        uploadClosesAt: toIso(closes),
        maxUploadsPerDevice: perPhone ? Number(perPhone) : null,
      });
      if (res.ok) {
        toast.success(t("saved"));
        setPin("");
        setRemovePin(false);
        router.refresh();
      } else {
        toast.error(t("error"));
      }
    });
  }

  function onDelete() {
    if (!window.confirm(t("deleteConfirm"))) return;
    start(async () => {
      const res = await deleteEvent(eventId);
      if (res.ok) router.push("/dashboard");
      else toast.error(t("error"));
    });
  }

  return (
    <div className="max-w-xl space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <Section title={t("general")}>
          <div className="space-y-1.5">
            <Label htmlFor="s-name">{tEvents("nameLabel")}</Label>
            <Input
              id="s-name"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={requireName}
              onChange={(e) => setRequireName(e.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            {t("requireName")}
          </label>
        </Section>

        <Section title={t("access")}>
          <div className="space-y-1.5">
            <Label htmlFor="s-pin">{t("pinLabel")}</Label>
            <Input
              id="s-pin"
              inputMode="numeric"
              pattern="\d{4,8}"
              maxLength={8}
              autoComplete="off"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="h-11 max-w-40 rounded-xl tracking-widest"
            />
            <p className="text-xs text-muted-foreground">
              {initial.hasPin && !removePin ? t("pinSet") : t("pinHint")}
            </p>
            {initial.hasPin && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={removePin}
                  onChange={(e) => setRemovePin(e.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
                {t("pinRemove")}
              </label>
            )}
          </div>
        </Section>

        <Section title={t("hours")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="s-opens">{t("opens")}</Label>
              <Input
                id="s-opens"
                type="datetime-local"
                value={opens}
                onChange={(e) => setOpens(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-closes">{t("closes")}</Label>
              <Input
                id="s-closes"
                type="datetime-local"
                value={closes}
                onChange={(e) => setCloses(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("hoursHint")}</p>

          <div className="space-y-1.5">
            <Label htmlFor="s-per">{t("perPhone")}</Label>
            <Input
              id="s-per"
              type="number"
              min={1}
              max={5000}
              inputMode="numeric"
              value={perPhone}
              onChange={(e) => setPerPhone(e.target.value)}
              className="h-11 max-w-40 rounded-xl"
            />
            <p className="text-xs text-muted-foreground">{t("perPhoneHint")}</p>
          </div>
        </Section>

        <Button
          type="submit"
          size="lg"
          className="h-11 rounded-xl px-6"
          disabled={pending}
        >
          {pending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              {t("saving")}
            </>
          ) : (
            t("save")
          )}
        </Button>
      </form>

      <Section title={t("danger")}>
        <p className="text-sm text-muted-foreground">{t("dangerBody")}</p>
        <Button
          type="button"
          variant="destructive"
          className="h-10 rounded-xl"
          disabled={pending}
          onClick={onDelete}
        >
          {t("delete")}
        </Button>
      </Section>
    </div>
  );
}
