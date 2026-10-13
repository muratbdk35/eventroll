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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { deleteEvent, updateSettings } from "@/lib/events/actions";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type Initial = {
  name: string;
  requireName: boolean;
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

function Row({
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
  const pinInvalid = s.pinOn && !initial.hasPin && !/^\d{4,8}$/.test(s.pin);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pinInvalid) return;
    start(async () => {
      const res = await updateSettings(eventId, {
        name: s.name,
        requireName: s.requireName,
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
                    className="h-9 max-w-40 text-center font-mono tracking-[0.35em]"
                  />
                  {initial.hasPin && (
                    <p className="text-xs text-muted-foreground">
                      {t("pinSet")}
                    </p>
                  )}
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
                  onCheckedChange={(v) => set("hoursOn", v)}
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
                    <Input
                      id="s-opens"
                      type="datetime-local"
                      value={s.opens}
                      onChange={(e) => set("opens", e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="s-closes"
                      className="text-xs text-muted-foreground"
                    >
                      {t("closes")}
                    </Label>
                    <Input
                      id="s-closes"
                      type="datetime-local"
                      value={s.closes}
                      onChange={(e) => set("closes", e.target.value)}
                      className="h-9"
                    />
                  </div>
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
          "fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 transition-all duration-200",
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
              disabled={pending || pinInvalid || !s.name.trim()}
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
