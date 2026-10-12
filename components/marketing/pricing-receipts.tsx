import { ArrowRight, Lock, Receipt, RotateCcw, Sparkles } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { plans, type PlanId } from "@/lib/plans";
import { publicEnv } from "@/lib/public-env";
import { cn } from "@/lib/utils";

// Layout adapted from 21st.dev "Receipt Tiers" (arihantcodes), restyled with
// our tokens, server-rendered and animated with CSS only.

const TORN_EDGE =
  "[clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),97%_100%,94%_calc(100%-8px),91%_100%,88%_calc(100%-8px),85%_100%,82%_calc(100%-8px),79%_100%,76%_calc(100%-8px),73%_100%,70%_calc(100%-8px),67%_100%,64%_calc(100%-8px),61%_100%,58%_calc(100%-8px),55%_100%,52%_calc(100%-8px),49%_100%,46%_calc(100%-8px),43%_100%,40%_calc(100%-8px),37%_100%,34%_calc(100%-8px),31%_100%,28%_calc(100%-8px),25%_100%,22%_calc(100%-8px),19%_100%,16%_calc(100%-8px),13%_100%,10%_calc(100%-8px),7%_100%,4%_calc(100%-8px),1%_100%,0_calc(100%-8px))]";

type PaidPlanId = Exclude<PlanId, "free">;
const PAID: PaidPlanId[] = ["standard", "premium"];
const FEATURED: PaidPlanId = "premium";
/** Guest count used for the "per guest" framing. */
const GUESTS = 150;

function Rule() {
  return (
    <span
      aria-hidden
      className="my-3 block border-t border-dashed border-border"
    />
  );
}

/** Circular "money-back" seal with text on a path. */
function GuaranteeSeal({ text, days }: { text: string; days: string }) {
  return (
    <div
      aria-hidden
      className="seal-spin absolute -end-6 -top-10 z-20 size-28 sm:-end-12"
    >
      <svg viewBox="0 0 120 120" className="size-full">
        <defs>
          <path
            id="seal-circle"
            d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"
          />
        </defs>
        <circle cx="60" cy="60" r="58" className="fill-foreground" />
        <circle
          cx="60"
          cy="60"
          r="34"
          fill="none"
          className="stroke-background/30"
          strokeDasharray="2 3"
        />
        <text className="fill-background font-mono text-[10.5px] font-bold tracking-[0.18em]">
          <textPath
            href="#seal-circle"
            startOffset="0"
            textLength="286"
            lengthAdjust="spacing"
          >
            {text}
          </textPath>
        </text>
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center font-heading leading-none text-background">
        <span className="text-2xl font-extrabold">{days}</span>
      </span>
    </div>
  );
}

export async function PricingReceipts() {
  const t = await getTranslations("Landing.pricing");
  const format = await getFormatter();
  const locale = await getLocale();
  // Locale-aware so Turkish gets "İ" rather than "I".
  const upper = (s: string) => s.toLocaleUpperCase(locale);
  const usd = (n: number, digits = 0) =>
    format.number(n, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

  const lines = (id: PaidPlanId): string[] => {
    const p = plans[id];
    const out = [
      t("lines.items", {
        count: format.number(p.maxItems),
        gb: p.maxBytes / 1024 ** 3,
      }),
      t("lines.video", { minutes: p.maxVideoSeconds / 60 }),
      t("lines.retention", { months: Math.round(p.retentionDays / 30.4) }),
      t("lines.zip"),
      p.customColors ? t("lines.templatesCustom") : t("lines.templatesAll"),
    ];
    if (p.liveSlideshow) out.push(t("lines.slideshow"));
    if (p.removeBranding) out.push(t("lines.removeBranding"));
    out.push(
      p.prioritySupport ? t("lines.prioritySupport") : t("lines.support"),
    );
    return out;
  };

  const trust = [
    { icon: Lock, label: t("trust.secure") },
    { icon: Receipt, label: t("trust.oneTime") },
    { icon: RotateCcw, label: t("trust.guarantee") },
  ];

  return (
    <section id="pricing" className="scroll-mt-20 px-4 py-24">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-secondary px-5 py-16 sm:px-10">
        <div className="mx-auto mb-16 max-w-xl text-center">
          <span className="font-mono text-[11px] tracking-[0.3em] text-muted-foreground">
            ··· {upper(t("eyebrow"))} ···
          </span>
          <h2 className="mt-4 font-heading text-3xl font-bold text-balance sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-pretty text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <ol className="mx-auto grid max-w-3xl grid-cols-1 items-center gap-12 font-mono md:grid-cols-2 md:gap-8">
          {PAID.map((id, i) => {
            const p = plans[id];
            const featured = id === FEATURED;
            return (
              <li
                key={id}
                style={{ animationDelay: `${i * 140}ms` }}
                className={cn(
                  "receipt-in relative",
                  featured ? "order-first md:order-2" : "md:order-1",
                )}
              >
                {featured && (
                  <>
                    <div
                      aria-hidden
                      className="absolute -inset-6 -z-0 rounded-[3rem] bg-primary/20 blur-3xl"
                    />
                    <GuaranteeSeal
                      text={upper(t("seal"))}
                      days={t("sealDays")}
                    />
                  </>
                )}
                <div
                  className={cn(
                    "relative bg-card px-6 pt-8 pb-8 text-[12.5px] leading-relaxed text-card-foreground transition-transform duration-300 hover:-translate-y-1",
                    TORN_EDGE,
                    featured
                      ? "shadow-[0_30px_60px_-24px_rgb(150_60_20/0.55)] md:scale-[1.05] md:rotate-[1deg]"
                      : "shadow-[0_18px_40px_-20px_rgb(60_30_10/0.45)] md:-rotate-1",
                  )}
                >
                  <p className="text-center text-[13.5px] font-bold tracking-[0.1em]">
                    {upper(publicEnv.appName)}
                  </p>
                  <p className="mt-1 text-center text-[10.5px] tracking-[0.06em] text-muted-foreground">
                    {t("merchantLine")}
                  </p>
                  <Rule />
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold tracking-[0.08em]">
                      {upper(t(`plans.${id}.name`))}
                    </h3>
                    {featured && (
                      <span className="-rotate-6 rounded border-2 border-primary px-2 py-0.5 text-[10.5px] font-bold tracking-[0.14em] whitespace-nowrap text-primary">
                        {upper(t("stamp"))}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t(`plans.${id}.tagline`)}
                  </p>
                  <Rule />
                  <ul className="space-y-1.5">
                    {lines(id).map((line) => (
                      <li key={line} className="flex items-baseline gap-2">
                        <span className="min-w-0 shrink">{upper(line)}</span>
                        <span
                          aria-hidden
                          className="mb-1 min-w-3 flex-1 border-b border-dotted border-border"
                        />
                        <span className="shrink-0 text-muted-foreground">
                          ✓
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Rule />
                  <div className="flex items-baseline justify-between text-[11.5px] text-muted-foreground">
                    <span>{t("billing")}</span>
                    <span>{t("oneTime")}</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-lg font-bold">{t("total")}</span>
                    <span
                      className={cn(
                        "font-heading text-4xl font-extrabold tracking-tight",
                        featured && "text-primary",
                      )}
                    >
                      {usd(p.priceUsd)}
                    </span>
                  </div>
                  <p className="mt-1 text-end text-[11px] text-muted-foreground">
                    {t("perGuest", {
                      price: usd(p.priceUsd / GUESTS, 2),
                      guests: GUESTS,
                    })}
                  </p>
                  <Rule />
                  <Link
                    href="/login"
                    className={cn(
                      "flex w-full items-center justify-center gap-2 py-3.5 text-[12.5px] font-bold tracking-[0.1em] transition-all active:scale-[0.98]",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                      featured
                        ? "bg-primary text-primary-foreground shadow-[0_10px_24px_-10px_var(--primary)] hover:bg-primary/90"
                        : "bg-foreground text-background hover:bg-foreground/90",
                    )}
                  >
                    {upper(t(`plans.${id}.cta`))}
                    <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
                  </Link>
                  <div
                    aria-hidden
                    className="mx-auto mt-5 h-9 w-4/5 [background-image:repeating-linear-gradient(90deg,currentColor_0,currentColor_2px,transparent_2px,transparent_5px,currentColor_5px,currentColor_6px,transparent_6px,transparent_9px)] opacity-70"
                  />
                  <p className="mt-2 text-center text-[10px] tracking-[0.2em] text-muted-foreground">
                    {t("thanks", { no: String(i + 1).padStart(4, "0") })}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <ul className="mx-auto mt-14 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
          {trust.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-2">
              <Icon className="size-4 text-primary" aria-hidden />
              {label}
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border border-dashed border-border bg-background/60 p-5 text-center sm:flex-row sm:text-start">
          <div className="flex items-center gap-3">
            <span className="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:flex">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-heading font-semibold">{t("trial.title")}</p>
              <p className="text-sm text-muted-foreground">
                {t("trial.body", {
                  photos: plans.free.maxItems,
                  days: plans.free.retentionDays,
                })}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0 rounded-xl">
            <Link href="/login">{t("trial.cta")}</Link>
          </Button>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
          {t("footnote")}
        </p>
      </div>
    </section>
  );
}
