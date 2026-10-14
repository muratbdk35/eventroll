"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { LogoMark } from "@/components/brand/logo";
import { HaloCard } from "@/components/halo/halo-card";
import { HaloProgress } from "@/components/halo/halo-progress";
import { Link } from "@/lib/i18n/navigation";
import { publicEnv } from "@/lib/public-env";
import { cn } from "@/lib/utils";
import { AccountStep } from "./account-step";
import { DetailsStep } from "./details-step";
import { type FlowProps, type FlowStep, STEPS } from "./flow";
import { PayStep } from "./pay-step";
import { PlanStep } from "./plan-step";
import { ReviewStep } from "./review-step";

// Built from cult/ui Halo parts (DECISIONS #37): a quiet top bar, the Halo
// progress bar with the step name, then each step on a Halo card. The plan
// step keeps its terracotta receipt panel and sits without a card.

const noop = () => () => {};

export function CreateFlow(props: FlowProps) {
  const { step, signedIn, event } = props;
  // The draft lives in localStorage, so steps render after hydration.
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const exit = event
    ? `/dashboard/events/${event.id}`
    : signedIn
      ? "/dashboard"
      : "/";

  return (
    <FlowShell step={step} exit={exit}>
      {!hydrated ? (
        <div className="h-72" />
      ) : step === "details" ? (
        <DetailsStep {...props} />
      ) : step === "plan" ? (
        <PlanStep {...props} />
      ) : step === "account" ? (
        <AccountStep {...props} />
      ) : step === "pay" ? (
        <PayStep {...props} />
      ) : (
        <ReviewStep {...props} />
      )}
    </FlowShell>
  );
}

/**
 * Top bar (brand, close), progress with the step's name, then the step on a
 * Halo card. The landing page renders this same shell.
 */
export function FlowShell({
  step,
  exit,
  children,
}: {
  step: FlowStep;
  exit: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("Create");
  const index = STEPS.indexOf(step);
  const wide = step === "plan";
  return (
    <div className={cn("w-full", wide ? "max-w-4xl" : "max-w-xl")}>
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-heading text-lg font-bold"
        >
          <LogoMark className="size-7" />
          {publicEnv.appName}
        </Link>
        <Link
          href={exit}
          aria-label={t("exit")}
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
        >
          <X className="size-5" aria-hidden />
        </Link>
      </div>

      <HaloProgress
        className="mt-6"
        value={((index + 1) / STEPS.length) * 100}
        label={t(`steps.${step}`)}
        aside={t("stepOf", { n: index + 1, total: STEPS.length })}
      />

      <div className="mt-6">
        {wide ? (
          children
        ) : (
          <HaloCard padding="lg" interactive={false}>
            {children}
          </HaloCard>
        )}
      </div>
    </div>
  );
}

/** Title + subtitle at the top of every step. */
export function StepHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-7">
      <h1 className="font-heading text-[1.65rem] leading-tight font-bold tracking-tight text-balance sm:text-3xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-[15px] text-pretty text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** Back on the left, the main action on the right. */
export function StepFooter({
  back,
  children,
}: {
  back?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-9 flex flex-wrap items-center justify-between gap-3">
      <div>{back}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
