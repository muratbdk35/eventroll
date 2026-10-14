"use client";

import {
  Clock,
  KeyRound,
  Loader2,
  Smartphone,
  Trash2,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateTimeField } from "@/components/ui/date-time-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { deleteEvent, updateSettings } from "@/lib/events/actions";
import { adjustEnd, clampEnd, maxEnd } from "@/lib/events/times";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type Initial = {
  name: string;
  requireName: boolean;
  startsAt: string;
  endsAt: string;
  eventDate: string;
  hasPin: boolean;
  uploadOpensAt: string | null;
  uploadClosesAt: string | null;
  maxUploadsPerDevice: number | null;
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

function initialState(i: Initial) {
  return {
    name: i.name,
    starts: toLocalInput(i.startsAt),
    ends: toLocalInput(i.endsAt),
    requireName: i.requireName,
    pinOn: i.hasPin,
    pin: "",
    hoursOn: Boolean(i.uploadOpensAt || i.uploadClosesAt),
    opens: toLocalInput(i.uploadOpensAt),
    closes: toLocalInput(i.uploadClosesAt),
    perPhoneOn: i.maxUploadsPerDevice !== null,
    perPhone: i.maxUploadsPerDevice?.toString() ?? "50",
  };
}

export function Row({
  icon: Icon,
  title,
  description,
  control,
  htmlFor,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  control?: React.ReactNode;
  htmlFor?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4 sm:px-6">
      <div className="flex items-start gap-4">
        <Icon className="mt-0.5 hidden size-4 shrink-0 text-muted-foreground sm:block" />
        <div className="min-w-0 flex-1">
          <label htmlFor={htmlFor} className="block text-sm font-medium">
            {title}
          </label>
          <p className="mt-0.5 text-[13px] text-pretty text-muted-foreground">
            {description}
          </p>
        </div>
        {control && <div className="shrink-0">{control}</div>}
      </div>
      {children && <div className="mt-3 sm:ps-8">{children}</div>}
    </div>
  );
}

export function SettingsForm({
  eventId,
  initial,
}: {
  eventId: string;
  initial: Initial;
}) {
  const t = useTranslations("Events.settings");
  const tEvents = useTranslations("Events");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [base, setBase] = useState(() => initialState(initial));
  const [s, setS] = useState(base);
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  const dirty = useMemo(
    () => JSON.stringify(s) !== JSON.stringify(base),
    [s, base],
  );
  // Empty keeps an existing PIN; anything typed must be 4-8 digits.
  const pinInvalid =
    s.pinOn &&
    (s.pin.length > 0 || !initial.hasPin) &&
    !/^\d{4,8}$/.test(s.pin);
  const rangeOk = new Date(s.ends) > new Date(s.starts);
  // Upload hours: both set and the close after the open (e.g. 20:00 -> 02:00 next day).
  const hoursOk =
    !s.hoursOn ||
    (Boolean(s.opens) &&
      Boolean(s.closes) &&
      new Date(s.closes) > new Date(s.opens));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pinInvalid || !rangeOk || !hoursOk) return;
    start(async () => {
      const res = await updateSettings(eventId, {
        name: s.name,
        requireName: s.requireName,
        startsAt: new Date(s.starts).toISOString(),
        endsAt: new Date(s.ends).toISOString(),
        eventDate: s.starts.slice(0, 10),
        pin: !s.pinOn
          ? initial.hasPin
            ? null
            : undefined
          : s.pin || undefined,
        uploadOpensAt: s.hoursOn ? toIso(s.opens) : null,
        uploadClosesAt: s.hoursOn ? toIso(s.closes) : null,
        maxUploadsPerDevice:
          s.perPhoneOn && s.perPhone ? Number(s.perPhone) : null,
      });
      if (res.ok) {
        toast.success(t("saved"));
        const next = { ...s, pin: "" };
        setBase(next);
        setS(next);
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
    <div className="space-y-4 pb-24">
      <form id="settings" onSubmit={onSubmit} className="space-y-4">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <h2 className="border-b border-border px-5 py-3.5 font-heading text-base font-semibold sm:px-6">
            {t("general")}
          </h2>
          <div className="px-5 py-4 sm:px-6">
            <Label htmlFor="s-name">{tEvents("nameLabel")}</Label>
            <Input
              id="s-name"
              required
              maxLength={80}
              value={s.name}
              onChange={(e) => set("name", e.target.value)}
              className="mt-2 h-9"
            />
          </div>
          <div className="grid gap-4 border-t border-border px-5 py-4 sm:grid-cols-2 sm:px-6">
            <div className="space-y-2">
              <Label htmlFor="s-starts">{tEvents("startLabel")}</Label>
              <DateTimeField
                id="s-starts"
                value={s.starts}
                onChange={(v) =>
                  setS((prev) => ({
                    ...prev,
                    starts: v,
                    ends: adjustEnd(v, prev.ends),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-ends">{tEvents("endLabel")}</Label>
              <DateTimeField
                id="s-ends"
                value={s.ends}
                min={s.starts}
                max={maxEnd(s.starts)}
                onChange={(v) => set("ends", clampEnd(s.starts, v))}
                invalid={!rangeOk}
              />
            </div>
            {!rangeOk && (
              <p
                className="text-sm text-destructive sm:col-span-2"
                role="alert"
              >
                {tEvents("dateRangeError")}
              </p>
            )}
          </div>
          <div className="border-t border-border">
            <Row
              icon={UserRound}
              title={t("requireName")}
              description={t("requireNameHint")}
              htmlFor="s-require-name"
              control={
                <Switch
                  id="s-require-name"
                  checked={s.requireName}
                  onCheckedChange={(v) => set("requireName", v)}
                />
              }
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <h2 className="border-b border-border px-5 py-3.5 font-heading text-base font-semibold sm:px-6">
            {t("access")}
          </h2>
          <div className="divide-y divide-border">
            <Row
              icon={KeyRound}
              title={t("pinToggle")}
              description={t("pinHint")}
              htmlFor="s-pin-on"
              control={
                <Switch
                  id="s-pin-on"
                  checked={s.pinOn}
                  onCheckedChange={(v) => set("pinOn", v)}
                />
              }
            >
              {s.pinOn && (
                <div className="space-y-1.5">
                  <Input
                    id="s-pin"
                    aria-label={t("pinLabel")}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={8}
                    placeholder={initial.hasPin ? "••••" : "1234"}
                    value={s.pin}
                    onChange={(e) =>
                      set("pin", e.target.value.replace(/\D/g, ""))
                    }
                    aria-invalid={pinInvalid && s.pin.length > 0}
                    aria-describedby="s-pin-hint"
                    className="h-9 max-w-40 text-center font-mono tracking-[0.35em]"
                  />
                  <p
                    id="s-pin-hint"
                    className={cn(
                      "text-xs",
                      pinInvalid && s.pin.length > 0
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {pinInvalid && s.pin.length > 0
                      ? t("pinFormat")
                      : initial.hasPin
                        ? t("pinSet")
                        : null}
                  </p>
                </div>
              )}
            </Row>

            <Row
              icon={Clock}
              title={t("hoursToggle")}
              description={t("hoursHint")}
              htmlFor="s-hours-on"
              control={
                <Switch
                  id="s-hours-on"
                  checked={s.hoursOn}
                  onCheckedChange={(v) =>
                    setS((prev) => ({
                      ...prev,
                      hoursOn: v,
                      opens: prev.opens || prev.starts,
                      closes: prev.closes || prev.ends,
                    }))
                  }
                />
              }
            >
              {s.hoursOn && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="s-opens"
                      className="text-xs text-muted-foreground"
                    >
                      {t("opens")}
                    </Label>
                    <DateTimeField
                      id="s-opens"
                      value={s.opens}
                      onChange={(v) => set("opens", v)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="s-closes"
                      className="text-xs text-muted-foreground"
                    >
                      {t("closes")}
                    </Label>
                    <DateTimeField
                      id="s-closes"
                      value={s.closes}
                      min={s.opens}
                      onChange={(v) => set("closes", v)}
                      invalid={!hoursOk}
                    />
                  </div>
                  {!hoursOk && (
                    <p
                      className="text-sm text-destructive sm:col-span-2"
                      role="alert"
                    >
                      {t("hoursError")}
                    </p>
                  )}
                </div>
              )}
            </Row>

            <Row
              icon={Smartphone}
              title={t("perPhoneToggle")}
              description={t("perPhoneHint")}
              htmlFor="s-per-on"
              control={
                <Switch
                  id="s-per-on"
                  checked={s.perPhoneOn}
                  onCheckedChange={(v) => set("perPhoneOn", v)}
                />
              }
            >
              {s.perPhoneOn && (
                <Input
                  id="s-per"
                  aria-label={t("perPhone")}
                  type="number"
                  min={1}
                  max={5000}
                  inputMode="numeric"
                  value={s.perPhone}
                  onChange={(e) => set("perPhone", e.target.value)}
                  className="h-9 max-w-28"
                />
              )}
            </Row>
          </div>
        </section>
      </form>

      <section className="rounded-2xl border border-destructive/20 bg-card p-5 shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">{t("danger")}</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {t("dangerBody")}
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            className="h-9 shrink-0 rounded-full px-4"
            disabled={pending}
            onClick={onDelete}
          >
            <Trash2 aria-hidden />
            {t("delete")}
          </Button>
        </div>
      </section>

      {/* Sticky save bar, only while there are unsaved changes. */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 transition-all duration-200",
          dirty
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
        aria-hidden={!dirty}
      >
        <div className="flex w-full max-w-lg items-center justify-between gap-3 rounded-full bg-foreground py-2 ps-5 pe-2 text-background shadow-2xl">
          <p className="text-sm font-medium">{t("unsaved")}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-8 rounded-full text-background hover:bg-white/10 hover:text-background"
              onClick={() => setS(base)}
              disabled={pending}
              tabIndex={dirty ? 0 : -1}
            >
              {t("discard")}
            </Button>
            <Button
              type="submit"
              form="settings"
              className="h-8 rounded-full px-4"
              disabled={
                pending || pinInvalid || !rangeOk || !hoursOk || !s.name.trim()
              }
              tabIndex={dirty ? 0 : -1}
            >
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {pending ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
