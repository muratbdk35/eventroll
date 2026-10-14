"use client";

import {
  CircleCheck,
  CircleDashed,
  ChevronRight,
  Download,
  ExternalLink,
  Lock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import type { PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { ActivatePlan } from "./activate-plan";
import { CopyLinkButton } from "./copy-link-button";

// Adapted from the 21st.dev "Onboarding Checklist" (ephraimduncan): circular
// progress in the header, the open step on a tinted surface with its action,
// the rest as single rows with a chevron.

type Step = {
  id: "create" | "plan" | "share" | "collect";
  title: string;
  body?: string;
  done: boolean;
  action?: React.ReactNode;
};

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
  link,
  photoCount,
}: {
  eventId: string;
  plan: PlanId | null;
  devMode: boolean;
  link: string;
  photoCount: number;
}) {
  const t = useTranslations("Events.steps");
  const planName = plan === "premium" ? "Premium" : "Standard";

  const lockedShare = (
    <p className="inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-2 text-sm text-muted-foreground">
      <Lock className="size-3.5" aria-hidden />
      {t("shareLocked")}
    </p>
  );

  const shareActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild className="h-9 rounded-full px-4">
        <a href={`/api/events/${eventId}/qr?format=png&download`}>
          <Download aria-hidden />
          {t("downloadQr")}
        </a>
      </Button>
      <CopyLinkButton link={link} className="h-9 rounded-full bg-card px-4" />
      <Link
        href={`/dashboard/events/${eventId}?view=share`}
        className="inline-flex h-9 items-center gap-0.5 px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {t("allOptions")}
        <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
      </Link>
    </div>
  );

  const steps: Step[] = [
    { id: "create", title: t("create"), done: true },
    {
      id: "plan",
      title: plan ? t("planDone", { plan: planName }) : t("plan"),
      body: plan ? undefined : t("planBody"),
      done: Boolean(plan),
      action: plan ? undefined : (
        <ActivatePlan eventId={eventId} devMode={devMode} />
      ),
    },
    {
      id: "share",
      title: t("share"),
      body: t("shareBody"),
      done: photoCount > 0,
      action: plan ? shareActions : lockedShare,
    },
    {
      id: "collect",
      title: t("collect"),
      body:
        photoCount > 0
          ? t("collectDone", { count: photoCount })
          : t("collectBody"),
      done: photoCount > 0,
      action: (
        <Button
          asChild
          variant="outline"
          className="h-9 rounded-full bg-card px-4"
        >
          <a href={link} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden />
            {t("openGuestPage")}
          </a>
        </Button>
      ),
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const [openId, setOpenId] = useState<Step["id"] | null>(
    () => steps.find((s) => !s.done)?.id ?? null,
  );

  // Once everything is set up, the checklist shrinks to a share bar.
  if (doneCount === steps.length) {
    return (
      <section className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated per event, authenticated */}
        <img
          src={`/api/events/${eventId}/qr?format=svg`}
          alt=""
          width={56}
          height={56}
          className="hidden size-14 rounded-xl border border-border bg-white p-1 sm:block"
        />
        <div className="min-w-[14rem] flex-1">
          <p className="font-semibold">{t("share")}</p>
          <p className="text-sm text-muted-foreground">{t("shareBody")}</p>
        </div>
        {shareActions}
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex flex-col gap-2 px-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-lg font-semibold">{t("cardTitle")}</h2>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircularProgress value={doneCount / steps.length} />
          {t("progress", {
            done: doneCount,
            total: steps.length,
          })}
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
                  {(step.body || step.action) && (
                    <ChevronRight
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-out rtl:rotate-180",
                        open && "rotate-90 rtl:rotate-90",
                      )}
                      aria-hidden
                    />
                  )}
                </button>
                {/* Smooth height animation without measuring (grid rows 0fr → 1fr). */}
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-out",
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="px-3 ps-11 pb-4">
                      {step.body && (
                        <p className="text-sm text-pretty text-muted-foreground">
                          {step.body}
                        </p>
                      )}
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
