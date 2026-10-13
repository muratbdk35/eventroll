"use client";

import { Check, ChevronRight, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import type { PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { ActivatePlan } from "./activate-plan";
import { CopyLinkButton } from "./copy-link-button";

type StepState = "done" | "current" | "todo";

function Step({
  n,
  state,
  title,
  body,
  last,
  children,
}: {
  n: number;
  state: StepState;
  title: string;
  body?: string;
  last?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li className="relative flex gap-4 pb-7 last:pb-0">
      {!last && (
        <span
          aria-hidden
          className={cn(
            "absolute start-[15px] top-9 bottom-1 w-px",
            state === "done" ? "bg-success/40" : "bg-border",
          )}
        />
      )}
      <span
        className={cn(
          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
          state === "done" && "bg-success text-white",
          state === "current" &&
            "bg-primary text-primary-foreground ring-4 ring-primary/15",
          state === "todo" &&
            "border border-border bg-card text-muted-foreground",
        )}
      >
        {state === "done" ? <Check className="size-4" strokeWidth={3} /> : n}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <p
          className={cn(
            "font-semibold",
            state === "todo" && "text-muted-foreground",
          )}
        >
          {title}
        </p>
        {body && (
          <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
            {body}
          </p>
        )}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </li>
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
  const [picking, setPicking] = useState(false);
  const planName = plan === "premium" ? "Premium" : "Standard";

  const planState: StepState = plan ? "done" : "current";
  const shareState: StepState = !plan
    ? "todo"
    : photoCount > 0
      ? "done"
      : "current";
  const collectState: StepState = photoCount > 0 ? "done" : "todo";

  // Once everything is set up, the checklist shrinks to a share bar.
  if (plan && photoCount > 0) {
    return (
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated per event, authenticated */}
        <img
          src={`/api/events/${eventId}/qr?format=svg`}
          alt=""
          width={56}
          height={56}
          className="hidden size-14 rounded-lg border border-border bg-white p-1 sm:block"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t("share")}</p>
          <p className="text-sm text-muted-foreground">{t("shareBody")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" className="h-9 rounded-full px-4">
            <a href={`/api/events/${eventId}/qr?format=png&download`}>
              <Download aria-hidden />
              {t("downloadQr")}
            </a>
          </Button>
          <CopyLinkButton link={link} className="h-9 rounded-full px-4" />
          <Link
            href={`/dashboard/events/${eventId}?view=share`}
            title={t("allOptions")}
            className="inline-flex h-9 items-center gap-0.5 rounded-full px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:w-9 sm:justify-center sm:px-0"
          >
            <span className="sm:sr-only">{t("allOptions")}</span>
            <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="mb-5 font-heading text-lg font-semibold">{t("title")}</h2>
      <ol>
        <Step n={1} state="done" title={t("create")} />

        <Step
          n={2}
          state={planState}
          title={plan ? t("planDone", { plan: planName }) : t("plan")}
          body={plan ? undefined : t("planBody")}
        >
          {!plan &&
            (picking ? (
              <ActivatePlan eventId={eventId} devMode={devMode} />
            ) : (
              <Button
                className="h-10 rounded-full px-5"
                onClick={() => setPicking(true)}
              >
                {t("plan")}
              </Button>
            ))}
        </Step>

        <Step n={3} state={shareState} title={t("share")} body={t("shareBody")}>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant={shareState === "current" ? "default" : "outline"}
              className="h-9 rounded-full px-4"
            >
              <a href={`/api/events/${eventId}/qr?format=png&download`}>
                <Download aria-hidden />
                {t("downloadQr")}
              </a>
            </Button>
            <CopyLinkButton link={link} className="h-9 rounded-full px-4" />
            <Link
              href={`/dashboard/events/${eventId}?view=share`}
              className="inline-flex items-center gap-0.5 px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {t("allOptions")}
              <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
            </Link>
          </div>
        </Step>

        <Step
          n={4}
          state={collectState}
          title={t("collect")}
          body={
            photoCount > 0
              ? t("collectDone", { count: photoCount })
              : t("collectBody")
          }
          last
        />
      </ol>
    </section>
  );
}
