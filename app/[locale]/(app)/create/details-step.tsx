"use client";

import { Clock, KeyRound, Smartphone, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { HaloInput } from "@/components/halo/halo-input";
import { HaloSwitch } from "@/components/halo/halo-switch";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireBody,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/halo/questionnaire";
import { eventVisuals } from "@/components/host/event-visuals";
import { Row } from "@/components/host/settings-form";
import { DateTimeField } from "@/components/ui/date-time-field";
import { Label } from "@/components/ui/label";
import { EVENT_TYPES } from "@/lib/events/schemas";
import { adjustEnd, clampEnd, maxEnd } from "@/lib/events/times";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { type FlowProps, flowHref } from "./flow";
import {
  type Draft,
  draftOk,
  draftProblems,
  emptyDraft,
  loadDraft,
  saveDraft,
} from "./draft";

/** Step 1: the event, one question per screen, before any account. */
export function DetailsStep({ plan }: FlowProps) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(() => loadDraft() ?? emptyDraft());
  const [item, setItem] = useState<Question>("name");

  // Every change is kept in this browser, so nothing is lost on sign-in.
  useEffect(() => saveDraft(d), [d]);

  return (
    <DetailsQuestions
      draft={d}
      setDraft={setD}
      item={item}
      onItemChange={setItem}
      onDone={() => router.push(flowHref("plan", { plan }))}
    />
  );
}

export const QUESTIONS = ["name", "type", "when", "guests"] as const;
export type Question = (typeof QUESTIONS)[number];

/**
 * The four questions (name → type → when → guest settings). Also rendered,
 * inert, on the landing page.
 */
export function DetailsQuestions({
  draft: d,
  setDraft: setD,
  item,
  onItemChange,
  onDone,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  item: Question;
  onItemChange: (q: Question) => void;
  onDone: () => void;
}) {
  const t = useTranslations("Create");
  const tEvents = useTranslations("Events");
  const ts = useTranslations("Events.settings");
  // Errors show once the host tried to go on from that question.
  const [tried, setTried] = useState<Partial<Record<Question, boolean>>>({});
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setD((prev) => ({ ...prev, [k]: v }));

  const problems = draftProblems(d);
  const blocked: Record<Question, boolean> = {
    name: problems.name,
    type: false,
    when: problems.range,
    guests: problems.pin || problems.hours,
  };
  const show = (q: Question, p: boolean) => Boolean(p && tried[q]);
  // Navigation is ours: the primitive only counts its own inputs as answers,
  // and the date and settings questions have none.
  const forward = (q: Question) => (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (blocked[q]) {
      setTried((all) => ({ ...all, [q]: true }));
      return;
    }
    const i = QUESTIONS.indexOf(q);
    if (i === QUESTIONS.length - 1) onDone();
    else onItemChange(QUESTIONS[i + 1]);
  };
  const backward = (q: Question) => (e: React.SyntheticEvent) => {
    e.preventDefault();
    onItemChange(QUESTIONS[Math.max(0, QUESTIONS.indexOf(q) - 1)]);
  };
  const back = t("back");
  const next = t("details.continue");

  return (
    <Questionnaire
      noValidate
      item={item}
      onItemChange={(v) => onItemChange(v as Question)}
      shortcuts="letters"
      onSubmit={(e) => {
        e.preventDefault();
        setTried({ name: true, when: true, guests: true });
        if (draftOk(d)) onDone();
      }}
    >
      <div className="mb-6 flex items-center gap-3">
        <ol aria-hidden className="flex gap-1.5">
          {QUESTIONS.map((q, i) => (
            <li
              key={q}
              className={cn(
                "h-1 w-6 rounded-full transition-colors duration-300",
                i <= QUESTIONS.indexOf(item) ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </ol>
        <p className="text-sm text-muted-foreground tabular-nums">
          {t("details.question", {
            n: QUESTIONS.indexOf(item) + 1,
            total: QUESTIONS.length,
          })}
        </p>
      </div>

      <QuestionnaireItem name="name" invalid={show("name", blocked.name)}>
        <QuestionnaireTitle>{t("details.q.name")}</QuestionnaireTitle>
        <QuestionnaireDescription>
          {t("details.q.nameHint")}
        </QuestionnaireDescription>
        <QuestionnaireBody>
          <HaloInput
            size="lg"
            aria-label={tEvents("nameLabel")}
            maxLength={80}
            autoFocus
            placeholder={tEvents("namePlaceholder")}
            value={d.name}
            onChange={(e) => set("name", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") forward("name")(e);
            }}
            invalid={show("name", problems.name)}
          />
          {show("name", problems.name) && (
            <p
              className="mt-3 text-sm font-medium text-destructive"
              role="alert"
            >
              {t("details.nameRequired")}
            </p>
          )}
        </QuestionnaireBody>
        <QuestionnaireActions>
          <QuestionnaireNext onClick={forward("name")}>
            {next}
          </QuestionnaireNext>
        </QuestionnaireActions>
      </QuestionnaireItem>

      <QuestionnaireItem name="type">
        <QuestionnaireTitle>{t("details.q.type")}</QuestionnaireTitle>
        <QuestionnaireDescription>
          {t("details.q.typeHint")}
        </QuestionnaireDescription>
        <QuestionnaireBody>
          <QuestionnaireChoices className="sm:grid-cols-2">
            {EVENT_TYPES.map((value) => {
              const { Icon } = eventVisuals[value];
              return (
                <QuestionnaireChoice
                  key={value}
                  value={value}
                  checked={d.type === value}
                  onChange={(e) => {
                    if (e.target.checked) set("type", value);
                  }}
                  icon={<Icon />}
                >
                  {tEvents(`types.${value}`)}
                </QuestionnaireChoice>
              );
            })}
          </QuestionnaireChoices>
        </QuestionnaireBody>
        <QuestionnaireActions>
          <QuestionnairePrevious onClick={backward("type")}>
            {back}
          </QuestionnairePrevious>
          <QuestionnaireNext onClick={forward("type")}>
            {next}
          </QuestionnaireNext>
        </QuestionnaireActions>
      </QuestionnaireItem>

      <QuestionnaireItem name="when" invalid={show("when", blocked.when)}>
        <QuestionnaireTitle>{t("details.q.when")}</QuestionnaireTitle>
        <QuestionnaireDescription>
          {t("details.q.whenHint")}
        </QuestionnaireDescription>
        <QuestionnaireBody className="grid gap-4 sm:grid-cols-2">
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
            <p
              className="text-sm font-medium text-destructive sm:col-span-2"
              role="alert"
            >
              {tEvents("dateRangeError")}
            </p>
          )}
        </QuestionnaireBody>
        <QuestionnaireActions>
          <QuestionnairePrevious onClick={backward("when")}>
            {back}
          </QuestionnairePrevious>
          <QuestionnaireNext onClick={forward("when")}>
            {next}
          </QuestionnaireNext>
        </QuestionnaireActions>
      </QuestionnaireItem>

      <QuestionnaireItem name="guests" invalid={show("guests", blocked.guests)}>
        <QuestionnaireTitle>{t("details.q.guests")}</QuestionnaireTitle>
        <QuestionnaireDescription>
          {t("details.guestSettingsHint")}
        </QuestionnaireDescription>
        <QuestionnaireBody className="-mx-1 divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card/70 [&>div]:px-4 sm:[&>div]:px-5">
          <Row
            icon={UserRound}
            title={ts("requireName")}
            description={ts("requireNameHint")}
            htmlFor="d-require-name"
            control={
              <HaloSwitch
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
              <HaloSwitch
                id="d-pin-on"
                checked={d.pinOn}
                onCheckedChange={(v) => set("pinOn", v)}
              />
            }
          >
            {d.pinOn && (
              <div className="space-y-1.5">
                <HaloInput
                  aria-label={ts("pinLabel")}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={8}
                  placeholder="1234"
                  value={d.pin}
                  onChange={(e) =>
                    set("pin", e.target.value.replace(/\D/g, ""))
                  }
                  invalid={show("guests", problems.pin)}
                  shellClassName="max-w-44"
                  className="text-center font-mono tracking-[0.35em]"
                />
                <p
                  className={cn(
                    "text-xs",
                    show("guests", problems.pin)
                      ? "font-medium text-destructive"
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
              <HaloSwitch
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
                    className="text-sm font-medium text-destructive sm:col-span-2"
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
              <HaloSwitch
                id="d-per-on"
                checked={d.perPhoneOn}
                onCheckedChange={(v) => set("perPhoneOn", v)}
              />
            }
          >
            {d.perPhoneOn && (
              <HaloInput
                aria-label={ts("perPhone")}
                type="number"
                min={1}
                max={5000}
                inputMode="numeric"
                value={d.perPhone}
                onChange={(e) => set("perPhone", e.target.value)}
                shellClassName="max-w-32"
              />
            )}
          </Row>
        </QuestionnaireBody>
        <QuestionnaireActions>
          <QuestionnairePrevious onClick={backward("guests")}>
            {back}
          </QuestionnairePrevious>
          <QuestionnaireSubmit onClick={forward("guests")}>
            {t("details.next")}
          </QuestionnaireSubmit>
        </QuestionnaireActions>
      </QuestionnaireItem>
    </Questionnaire>
  );
}
