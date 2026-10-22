"use client";

import {
  ArrowLeft,
  Loader2,
  Lock,
  Receipt,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { HaloButton } from "@/components/halo/halo-button";
import {
  checkPromo,
  createEventFromDraft,
  devActivate,
  startCheckout,
} from "@/lib/events/actions";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { CURRENCY, plans } from "@/lib/plans";
import { cn } from "@/lib/utils";
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
  // EU law: consent to start at once and lose the withdrawal right once the
  // service is fully provided (terms, section 4). Stored on the order.
  const [consent, setConsent] = useState(false);
  const [payError, setPayError] = useState(false);
  const started = useRef(false);
  // Discount code (#79): checked on the server, applied again at checkout.
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [promo, setPromo] = useState<{
    code: string;
    percentOff: number;
    amount: number;
  } | null>(null);
  const [codeError, setCodeError] = useState<"invalid" | "rate_limited" | null>(
    null,
  );
  const [checking, startCheck] = useTransition();

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
            <HaloButton href={flowHref("details", { plan })} className="mt-5">
              {t("pay.backToDetails")}
            </HaloButton>
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
        <HaloButton href={flowHref("plan", { event: event.id })}>
          {t("steps.plan")}
        </HaloButton>
      </div>
    );
  }

  const p = plans[plan];
  const money = (n: number) =>
    format.number(n, {
      style: "currency",
      currency: CURRENCY,
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2,
    });
  const total = promo ? promo.amount / 100 : p.price;
  const free = promo !== null && promo.amount === 0;
  const lines: [string, string][] = [
    [t("pay.event"), event.name],
    [t("pay.plan", { plan: tp(`plans.${plan}.name`) }), money(p.price)],
    ...(promo
      ? ([
          [
            t("pay.discount", { code: promo.code, percent: promo.percentOff }),
            `−${money(p.price - total)}`,
          ],
        ] as [string, string][])
      : []),
  ];

  function applyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!codeInput.trim()) return;
    setCodeError(null);
    startCheck(async () => {
      const res = await checkPromo(event!.id, plan!, codeInput);
      if (res.ok) {
        setPromo({
          code: res.code,
          percentOff: res.percentOff,
          amount: res.amount,
        });
        setCodeOpen(false);
      } else {
        setCodeError(res.error === "rate_limited" ? "rate_limited" : "invalid");
      }
    });
  }

  function pay() {
    setPayError(false);
    startPay(async () => {
      if (devPay) {
        // Local development without Stripe: the plan is simply switched on.
        const res = await devActivate(event!.id, plan!);
        if (res.ok) router.push(flowHref("review", { event: event!.id }));
        return;
      }
      const res = await startCheckout(
        event!.id,
        plan!,
        consent,
        "create",
        promo?.code,
      );
      if (res.ok) window.location.assign(res.url);
      else setPayError(true);
    });
  }

  return (
    <div>
      <StepHeading title={t("pay.title")} subtitle={t("pay.subtitle")} />

      <div className="rounded-2xl border border-border/80 bg-card/70 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-accent text-primary">
            <Receipt className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">
              {tp(`plans.${plan}.name`)}, {tp("oneTime").toLowerCase()}
            </p>
            <p className="text-[13px] text-muted-foreground">
              {t("pay.includes", {
                photos: format.number(p.maxItems),
                gb: p.maxBytes / 1024 ** 3,
                days: p.retentionDays,
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
            {money(total)}
          </span>
        </div>
        {!devPay && (
          <div className="mt-3 border-t border-dashed border-border pt-3">
            {promo ? (
              <p className="flex items-center gap-2 text-[13px] text-success">
                <Tag className="size-4" aria-hidden />
                <span className="font-semibold">{promo.code}</span>
                <span className="text-muted-foreground">
                  −%{promo.percentOff}
                </span>
                <button
                  type="button"
                  onClick={() => setPromo(null)}
                  className="ms-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden />
                  {t("pay.codeRemove")}
                </button>
              </p>
            ) : codeOpen ? (
              <form onSubmit={applyCode} className="flex gap-2">
                <input
                  autoFocus
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder={t("pay.codePlaceholder")}
                  aria-label={t("pay.codePlaceholder")}
                  autoCapitalize="characters"
                  autoComplete="off"
                  maxLength={40}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 text-sm uppercase outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                <button
                  type="submit"
                  disabled={checking || !codeInput.trim()}
                  className="h-10 shrink-0 rounded-xl bg-secondary px-4 text-sm font-semibold disabled:opacity-50"
                >
                  {checking ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    t("pay.codeApply")
                  )}
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setCodeOpen(true)}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
              >
                <Tag className="size-3.5" aria-hidden />
                {t("pay.codeToggle")}
              </button>
            )}
            {codeError && (
              <p role="alert" className="mt-2 text-xs text-destructive">
                {t(
                  codeError === "rate_limited"
                    ? "pay.codeTooMany"
                    : "pay.codeInvalid",
                )}
              </p>
            )}
          </div>
        )}
      </div>
      {!devPay && (
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-border/80 bg-card/70 p-3.5 text-[13px] leading-snug text-pretty">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 size-4.5 shrink-0 accent-primary"
          />
          <span>
            {t.rich("pay.consent", {
              terms: (c) => (
                <Link
                  href="/legal/terms"
                  target="_blank"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  {c}
                </Link>
              ),
              withdrawal: (c) => (
                <Link
                  href="/legal/withdrawal"
                  target="_blank"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  {c}
                </Link>
              ),
            })}
          </span>
        </label>
      )}
      <HaloButton
        size="lg"
        fullWidth
        className="mt-5"
        disabled={!devPay && !consent}
        isLoading={paying}
        leading={free ? <Sparkles aria-hidden /> : <Lock aria-hidden />}
        onClick={pay}
      >
        {free ? t("pay.buttonFree") : t("pay.button", { price: money(total) })}
      </HaloButton>
      <p
        role={payError ? "alert" : undefined}
        className={cn(
          "mt-3 text-center text-xs text-pretty",
          payError ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {payError
          ? t("pay.failed")
          : devPay
            ? t("pay.devNote")
            : t("pay.secure")}
      </p>

      <StepFooter
        back={
          <HaloButton
            tone="secondary"
            href={flowHref("plan", { plan, event: event.id })}
            leading={<ArrowLeft className="rtl:rotate-180" aria-hidden />}
          >
            {t("pay.changePlan")}
          </HaloButton>
        }
      />
    </div>
  );
}
