"use client";

import {
  ChevronRight,
  CircleCheck,
  CircleDashed,
  Loader2,
  Lock,
  Pencil,
  Rocket,
  Sparkles,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useSyncExternalStore, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { devActivate, publishEvent } from "@/lib/events/actions";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { plans, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { ActivatePlan } from "./activate-plan";

// Adapted from the 21st.dev "Onboarding Checklist" (ephraimduncan): circular
// progress in the header, the open step on a tinted surface with its action,
// the rest as single rows with a chevron. Only shown while the event is a
// draft: create → plan → publish (DECISIONS #31). Every step can be opened,
// done ones included.

type Step = {
  id: "create" | "plan" | "publish";
  title: string;
  body: string;
  done: boolean;
  action?: React.ReactNode;
};

const GB = 1024 ** 3;
const noop = () => () => {};

function CircularProgress({ value }: { value: number }) {
  return (
    <svg className="size-4 -rotate-90" viewBox="0 0 16 16" aria-hidden>
      <circle
        className="stroke-primary/15"
        cx="8"
        cy="8"
        r="6.5"
        fill="none"
        strokeWidth="2.5"
        pathLength={100}
      />
      <circle
        className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
        cx="8"
        cy="8"
        r="6.5"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="100"
        style={{ strokeDashoffset: 100 - value * 100 }}
      />
    </svg>
  );
}

export function NextSteps({
  eventId,
  plan,
  devMode,
  when,
}: {
  eventId: string;
  plan: PlanId | null;
  devMode: boolean;
  /** Pre-formatted event date plus raw times for the "created" summary. */
  when: { date: string; startsAt: string | null; endsAt: string | null };
}) {
  const t = useTranslations("Events.steps");
  const format = useFormatter();
  // Times are shown in the host's own time zone, so only after mount (the
  // server does not know it).
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const hm = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  const clock =
    hydrated && when.startsAt && when.endsAt
      ? { start: hm(when.startsAt), end: hm(when.endsAt) }
      : null;
  const router = useRouter();
  const [publishing, startPublish] = useTransition();
  const [upgrading, startUpgrade] = useTransition();
  const planName = plan === "premium" ? "Premium" : "Standard";

  function publish() {
    startPublish(async () => {
      const res = await publishEvent(eventId);
      if (res.ok) {
        const confetti = (await import("canvas-confetti")).default;
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.35 } });
        }
      }
      router.refresh();
    });
  }

  function upgrade() {
    startUpgrade(async () => {
      await devActivate(eventId, "premium");
      router.refresh();
    });
  }

  const steps: Step[] = [
    {
      id: "create",
      title: t("createDone"),
      body: clock ? t("createBody", { date: when.date, ...clock }) : when.date,
      done: true,
      action: (
        <Button
          asChild
          variant="outline"
          className="h-9 rounded-full bg-card px-4"
        >
          <Link href={`/dashboard/events/${eventId}?view=settings`}>
            <Pencil aria-hidden />
            {t("editDetails")}
          </Link>
        </Button>
      ),
    },
    plan
      ? {
          id: "plan",
          title: t("planDone", { plan: planName }),
          body: t("planSummary", {
            photos: format.number(plans[plan].maxItems),
            gb: plans[plan].maxBytes / GB,
          }),
          done: true,
          action:
            plan === "standard" && devMode ? (
              <Button
                variant="outline"
                className="h-9 rounded-full bg-card px-4"
                disabled={upgrading}
                onClick={upgrade}
              >
                {upgrading ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <Sparkles aria-hidden />
                )}
                {t("upgrade")}
              </Button>
            ) : undefined,
        }
      : {
          id: "plan",
          title: t("plan"),
          body: t("planBody"),
          done: false,
          action: <ActivatePlan eventId={eventId} devMode={devMode} />,
        },
    {
      id: "publish",
      title: t("publish"),
      body: t("publishBody"),
      done: false,
      action: plan ? (
        <Button
          className="h-10 rounded-full px-5 shadow-[0_10px_24px_-10px_var(--primary)]"
          disabled={publishing}
          onClick={publish}
        >
          {publishing ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Rocket aria-hidden />
          )}
          {publishing ? t("publishing") : t("publish")}
        </Button>
      ) : (
        <p className="inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-2 text-sm text-muted-foreground">
          <Lock className="size-3.5" aria-hidden />
          {t("publishLocked")}
        </p>
      ),
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  // The page re-keys this component when the plan changes, so after choosing
  // a plan it remounts with the publish step open instead of collapsing.
  const [openId, setOpenId] = useState<Step["id"] | null>(
    () => steps.find((s) => !s.done)?.id ?? null,
  );

  return (
    <section className="rounded-3xl border border-border bg-card p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex flex-col gap-2 px-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-lg font-semibold">{t("cardTitle")}</h2>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircularProgress value={doneCount / steps.length} />
          {t("progress", { done: doneCount, total: steps.length })}
        </p>
      </div>

      <ol>
        {steps.map((step, i) => {
          const open = openId === step.id;
          const prevOpen = i > 0 && openId === steps[i - 1].id;
          return (
            <li
              key={step.id}
              className={cn(
                !(i === 0 || open || prevOpen) && "border-t border-border/70",
              )}
            >
              <div
                className={cn(
                  "rounded-2xl transition-colors duration-300 ease-out",
                  open && "bg-accent/45 ring-1 ring-primary/10",
                )}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : step.id)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {step.done ? (
                    <CircleCheck
                      className="size-5 shrink-0 fill-primary text-card"
                      aria-hidden
                    />
                  ) : (
                    <CircleDashed
                      className="size-5 shrink-0 text-muted-foreground/50"
                      aria-hidden
                    />
                  )}
                  <span
                    className={cn(
                      "flex-1 font-semibold",
                      step.done ? "text-primary" : "text-foreground",
                    )}
                  >
                    {step.title}
                  </span>
                  <ChevronRight
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-out rtl:rotate-180",
                      open && "rotate-90 rtl:rotate-90",
                    )}
                    aria-hidden
                  />
                </button>
                {/* Smooth height animation without measuring (grid rows 0fr → 1fr). */}
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-out",
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden" inert={!open}>
                    <div className="px-3 ps-11 pb-4">
                      <p className="text-sm text-pretty text-muted-foreground">
                        {step.body}
                      </p>
                      {step.action && <div className="mt-3">{step.action}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
