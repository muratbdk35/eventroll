"use client";

import { ArrowLeft, Loader2, Lock, Receipt } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createEventFromDraft, devActivate } from "@/lib/events/actions";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { DOWNLOAD_WINDOW_DAYS, plans } from "@/lib/plans";
import { StepFooter, StepHeading } from "./create-flow";
import { type FlowProps, flowHref } from "./flow";
import { clearDraft, draftOk, draftPayload, loadDraft } from "./draft";

// Summary layout from the 21st.dev "Checkout Summary" (astralyxdev): line
// items, then charges not known yet shown as "calculated at checkout" rather
// than a false zero, then the total and one pay button.

/** Step 4: save the draft (first visit after sign-in), then pay. */
export function PayStep({ plan, event, devPay }: FlowProps) {
  const t = useTranslations("Create");
  const tp = useTranslations("Landing.pricing");
  const format = useFormatter();
  const router = useRouter();
  const [paying, startPay] = useTransition();
  const [saveError, setSaveError] = useState<"missing" | "failed" | null>(null);
  const started = useRef(false);

  // Coming back from sign-in: turn the browser draft into a real event once.
  useEffect(() => {
    if (event || started.current) return;
    started.current = true;
    const draft = loadDraft();
    if (!draft || !draftOk(draft)) {
      queueMicrotask(() => setSaveError("missing"));
      return;
    }
    createEventFromDraft(...draftPayload(draft)).then((res) => {
      if (!res.ok) return setSaveError("failed");
      clearDraft();
      router.replace(flowHref("pay", { plan, event: res.id }));
    });
  }, [event, plan, router]);

  if (!event) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        {saveError ? (
          <>
            <p className="max-w-sm text-sm text-pretty text-muted-foreground">
              {t(
                saveError === "missing" ? "pay.draftMissing" : "pay.saveFailed",
              )}
            </p>
            <Button asChild className="mt-5 h-10 rounded-full px-5">
              <Link href={flowHref("details", { plan })}>
                {t("pay.backToDetails")}
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
            <p className="mt-3 text-sm text-muted-foreground">
              {t("pay.saving")}
            </p>
          </>
        )}
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="py-12 text-center">
        <Button asChild className="h-10 rounded-full px-5">
          <Link href={flowHref("plan", { event: event.id })}>
            {t("steps.plan")}
          </Link>
        </Button>
      </div>
    );
  }

  const p = plans[plan];
  const usd = (n: number) =>
    format.number(n, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  const lines: [string, string][] = [
    [t("pay.event"), event.name],
    [t("pay.plan", { plan: tp(`plans.${plan}.name`) }), usd(p.priceUsd)],
  ];

  function pay() {
    startPay(async () => {
      // Stripe Checkout replaces this in phase 1C; until then dev only.
      const res = await devActivate(event!.id, plan!);
      if (res.ok) router.push(flowHref("review", { event: event!.id }));
    });
  }

  return (
    <div>
      <StepHeading title={t("pay.title")} subtitle={t("pay.subtitle")} />

      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-accent text-primary">
            <Receipt className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">
              {tp(`plans.${plan}.name`)} · {tp("oneTime").toLowerCase()}
            </p>
            <p className="text-[13px] text-muted-foreground">
              {t("pay.includes", {
                photos: format.number(p.maxItems),
                gb: p.maxBytes / 1024 ** 3,
                days: DOWNLOAD_WINDOW_DAYS,
              })}
            </p>
          </div>
        </div>

        <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
          {lines.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="min-w-0 truncate text-end font-medium">{v}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("pay.tax")}</dt>
            <dd className="text-end text-muted-foreground italic">
              {t("pay.taxValue")}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span className="font-semibold">{t("pay.total")}</span>
          <span className="font-heading text-3xl font-extrabold tracking-tight">
            {usd(p.priceUsd)}
          </span>
        </div>

        <Button
          className="mt-5 h-12 w-full rounded-full text-[15px] shadow-[0_10px_24px_-10px_var(--primary)]"
          disabled={!devPay || paying}
          onClick={pay}
        >
          {paying ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Lock aria-hidden />
          )}
          {t("pay.button", { price: usd(p.priceUsd) })}
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {devPay ? t("pay.devNote") : t("pay.secure")}
        </p>
      </div>

      <StepFooter
        back={
          <Button asChild variant="ghost" className="h-10 rounded-full px-4">
            <Link href={flowHref("plan", { plan, event: event.id })}>
              <ArrowLeft className="rtl:rotate-180" aria-hidden />
              {t("pay.changePlan")}
            </Link>
          </Button>
        }
      />
    </div>
  );
}
