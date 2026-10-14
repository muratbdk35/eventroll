"use client";

import {
  CalendarHeart,
  Check,
  CreditCard,
  Receipt,
  Rocket,
  UserRound,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Link } from "@/lib/i18n/navigation";
import { publicEnv } from "@/lib/public-env";
import { cn } from "@/lib/utils";
import { AccountStep } from "./account-step";
import { DetailsStep } from "./details-step";
import { type FlowProps, type FlowStep, STEPS } from "./flow";
import { PayStep } from "./pay-step";
import { PlanStep } from "./plan-step";
import { ReviewStep } from "./review-step";

// Shell adapted from the 21st.dev "Multi-Step Setup Wizard" (olewandowski1):
// brand row with a "step x of y" chip, a progress bar, labelled step icons,
// then the step's title, body and back/next footer.

const icons = {
  details: CalendarHeart,
  plan: Receipt,
  account: UserRound,
  pay: CreditCard,
  review: Rocket,
} as const;

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
    <div className={cn("w-full", step === "plan" ? "max-w-4xl" : "max-w-2xl")}>
      <FlowCard step={step} exit={exit}>
        {!hydrated ? (
          <div className="h-64" />
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
      </FlowCard>
    </div>
  );
}

/**
 * The wizard card: brand row with "step x of y", progress bar, labelled step
 * icons, then the step itself. The landing page shows this same card.
 */
export function FlowCard({
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
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-[0_30px_60px_-40px_rgb(60_30_10/0.35)] sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-heading text-lg font-bold"
        >
          <LogoMark className="size-7" />
          {publicEnv.appName}
        </Link>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tabular-nums">
            {t("stepOf", { n: index + 1, total: STEPS.length })}
          </span>
          <Link
            href={exit}
            aria-label={t("exit")}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
        />
      </div>
      <ol className="mt-4 grid grid-cols-5 gap-1">
        {STEPS.map((s, i) => {
          const Icon = icons[s];
          const isDone = i < index;
          const current = s === step;
          return (
            <li key={s} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border transition-colors",
                  current
                    ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_18px_-8px_var(--primary)]"
                    : isDone
                      ? "border-primary/30 bg-accent text-primary"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                {isDone && !current ? (
                  <Check className="size-4" strokeWidth={2.5} aria-hidden />
                ) : (
                  <Icon className="size-4" aria-hidden />
                )}
              </span>
              <span
                className={cn(
                  "text-center text-[11px] leading-tight sm:text-xs",
                  current
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {t(`steps.${s}`)}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-8">{children}</div>
    </section>
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
    <div className="mb-6">
      <h1 className="font-heading text-2xl font-bold tracking-tight text-balance">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
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
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
      <div>{back}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
