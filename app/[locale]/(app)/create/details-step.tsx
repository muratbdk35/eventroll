"use client";

import {
  ArrowRight,
  Clock,
  KeyRound,
  Smartphone,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { eventVisuals } from "@/components/host/event-visuals";
import { Row } from "@/components/host/settings-form";
import { Button } from "@/components/ui/button";
import { DateTimeField } from "@/components/ui/date-time-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EVENT_TYPES } from "@/lib/events/schemas";
import { adjustEnd, clampEnd, maxEnd } from "@/lib/events/times";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { StepFooter, StepHeading } from "./create-flow";
import { type FlowProps, flowHref } from "./flow";
import {
  type Draft,
  draftOk,
  draftProblems,
  emptyDraft,
  loadDraft,
  saveDraft,
} from "./draft";

/** Step 1: the event and every guest setting, before any account. */
export function DetailsStep({ plan }: FlowProps) {
  const t = useTranslations("Create");
  const tEvents = useTranslations("Events");
  const ts = useTranslations("Events.settings");
  const router = useRouter();
  const [d, setD] = useState<Draft>(() => loadDraft() ?? emptyDraft());
  const [tried, setTried] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setD((prev) => ({ ...prev, [k]: v }));

  // Every change is kept in this browser, so nothing is lost on sign-in.
  useEffect(() => saveDraft(d), [d]);

  const problems = draftProblems(d);
  const show = (p: boolean) => p && tried;

  function next(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!draftOk(d)) return;
    router.push(flowHref("plan", { plan }));
  }

  return (
    <form onSubmit={next} noValidate>
      <StepHeading
        title={t("details.title")}
        subtitle={t("details.subtitle")}
      />

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">{tEvents("nameLabel")}</Label>
          <Input
            id="name"
            maxLength={80}
            autoFocus
            placeholder={tEvents("namePlaceholder")}
            value={d.name}
            onChange={(e) => set("name", e.target.value)}
            aria-invalid={show(problems.name)}
            className="h-11 text-base"
          />
          {show(problems.name) && (
            <p className="text-sm text-destructive" role="alert">
              {t("details.nameRequired")}
            </p>
          )}
        </div>

        <fieldset>
          <legend className="mb-2.5 text-sm leading-none font-medium">
            {tEvents("typeLabel")}
          </legend>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((value) => {
              const { Icon } = eventVisuals[value];
              const selected = d.type === value;
              return (
                <label
                  key={value}
                  className={cn(
                    "flex h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring/50",
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
                    onChange={() => set("type", value)}
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
                    {tEvents(`types.${value}`)}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="starts">{tEvents("startLabel")}</Label>
            <DateTimeField
              id="starts"
              value={d.starts}
              onChange={(v) =>
                setD((prev) => ({
                  ...prev,
                  starts: v,
                  ends: adjustEnd(v, prev.ends),
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ends">{tEvents("endLabel")}</Label>
            <DateTimeField
              id="ends"
              value={d.ends}
              min={d.starts}
              max={maxEnd(d.starts)}
              onChange={(v) => set("ends", clampEnd(d.starts, v))}
              invalid={problems.range}
            />
          </div>
          {problems.range && (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {tEvents("dateRangeError")}
            </p>
          )}
        </div>
      </div>

      <h2 className="mt-9 mb-1 font-heading text-base font-semibold">
        {t("details.guestSettings")}
      </h2>
      <p className="mb-3 text-[13px] text-muted-foreground">
        {t("details.guestSettingsHint")}
      </p>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border [&>div]:px-4 sm:[&>div]:px-5">
        <Row
          icon={UserRound}
          title={ts("requireName")}
          description={ts("requireNameHint")}
          htmlFor="d-require-name"
          control={
            <Switch
              id="d-require-name"
              checked={d.requireName}
              onCheckedChange={(v) => set("requireName", v)}
            />
          }
        />
        <Row
          icon={KeyRound}
          title={ts("pinToggle")}
          description={ts("pinHint")}
          htmlFor="d-pin-on"
          control={
            <Switch
              id="d-pin-on"
              checked={d.pinOn}
              onCheckedChange={(v) => set("pinOn", v)}
            />
          }
        >
          {d.pinOn && (
            <div className="space-y-1.5">
              <Input
                aria-label={ts("pinLabel")}
                inputMode="numeric"
                autoComplete="off"
                maxLength={8}
                placeholder="1234"
                value={d.pin}
                onChange={(e) => set("pin", e.target.value.replace(/\D/g, ""))}
                aria-invalid={show(problems.pin)}
                className="h-9 max-w-40 text-center font-mono tracking-[0.35em]"
              />
              <p
                className={cn(
                  "text-xs",
                  show(problems.pin)
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {ts("pinFormat")}
              </p>
            </div>
          )}
        </Row>
        <Row
          icon={Clock}
          title={ts("hoursToggle")}
          description={ts("hoursHint")}
          htmlFor="d-hours-on"
          control={
            <Switch
              id="d-hours-on"
              checked={d.hoursOn}
              onCheckedChange={(v) =>
                setD((prev) => ({
                  ...prev,
                  hoursOn: v,
                  opens: prev.opens || prev.starts,
                  closes: prev.closes || prev.ends,
                }))
              }
            />
          }
        >
          {d.hoursOn && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="d-opens"
                  className="text-xs text-muted-foreground"
                >
                  {ts("opens")}
                </Label>
                <DateTimeField
                  id="d-opens"
                  value={d.opens}
                  onChange={(v) => set("opens", v)}
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="d-closes"
                  className="text-xs text-muted-foreground"
                >
                  {ts("closes")}
                </Label>
                <DateTimeField
                  id="d-closes"
                  value={d.closes}
                  min={d.opens}
                  onChange={(v) => set("closes", v)}
                  invalid={problems.hours}
                />
              </div>
              {problems.hours && (
                <p
                  className="text-sm text-destructive sm:col-span-2"
                  role="alert"
                >
                  {ts("hoursError")}
                </p>
              )}
            </div>
          )}
        </Row>
        <Row
          icon={Smartphone}
          title={ts("perPhoneToggle")}
          description={ts("perPhoneHint")}
          htmlFor="d-per-on"
          control={
            <Switch
              id="d-per-on"
              checked={d.perPhoneOn}
              onCheckedChange={(v) => set("perPhoneOn", v)}
            />
          }
        >
          {d.perPhoneOn && (
            <Input
              aria-label={ts("perPhone")}
              type="number"
              min={1}
              max={5000}
              inputMode="numeric"
              value={d.perPhone}
              onChange={(e) => set("perPhone", e.target.value)}
              className="h-9 max-w-28"
            />
          )}
        </Row>
      </div>

      <StepFooter>
        <Button type="submit" className="h-11 rounded-full px-6">
          {t("details.next")}
          <ArrowRight className="rtl:rotate-180" aria-hidden />
        </Button>
      </StepFooter>
    </form>
  );
}
