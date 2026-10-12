import {
  ArrowRight,
  Download,
  Lock,
  QrCode,
  Receipt,
  Sparkles,
} from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import {
  DOWNLOAD_WINDOW_DAYS,
  planOrder,
  plans,
  type PlanId,
} from "@/lib/plans";
import { publicEnv } from "@/lib/public-env";
import { cn } from "@/lib/utils";

// Receipt layout adapted from 21st.dev "Receipt Tiers" (arihantcodes), restyled
// with our tokens, server-rendered and animated with CSS only.

const TORN_EDGE =
  "[clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),97%_100%,94%_calc(100%-8px),91%_100%,88%_calc(100%-8px),85%_100%,82%_calc(100%-8px),79%_100%,76%_calc(100%-8px),73%_100%,70%_calc(100%-8px),67%_100%,64%_calc(100%-8px),61%_100%,58%_calc(100%-8px),55%_100%,52%_calc(100%-8px),49%_100%,46%_calc(100%-8px),43%_100%,40%_calc(100%-8px),37%_100%,34%_calc(100%-8px),31%_100%,28%_calc(100%-8px),25%_100%,22%_calc(100%-8px),19%_100%,16%_calc(100%-8px),13%_100%,10%_calc(100%-8px),7%_100%,4%_calc(100%-8px),1%_100%,0_calc(100%-8px))]";

const FEATURED: PlanId = "premium";
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

/** Rotating circular seal with text on a path. */
function Seal({ text, center }: { text: string; center: string }) {
  return (
    <div
      aria-hidden
      className="seal-spin absolute -end-5 -top-12 z-20 size-28 sm:-end-12"
    >
      <svg viewBox="0 0 120 120" className="size-full drop-shadow-xl">
        <defs>
          <path
            id="seal-circle"
            d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"
          />
        </defs>
        <circle cx="60" cy="60" r="58" fill="oklch(0.23 0.02 40)" />
        <circle
          cx="60"
          cy="60"
          r="34"
          fill="none"
          stroke="white"
          strokeOpacity=".25"
          strokeDasharray="2 3"
        />
        <text fill="white" className="font-mono text-[10.5px] font-bold">
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
      <span className="absolute inset-0 flex items-center justify-center font-heading text-3xl font-extrabold text-white">
        {center}
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

  const lines = (id: PlanId): string[] => {
    const p = plans[id];
    const out = [
      t("lines.items", {
        count: format.number(p.maxItems),
        gb: p.maxBytes / 1024 ** 3,
      }),
      t("lines.video", { minutes: p.maxVideoSeconds / 60 }),
      t("lines.original"),
      t("lines.zip", { days: DOWNLOAD_WINDOW_DAYS }),
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
    { icon: Sparkles, label: t("trust.original") },
    { icon: Download, label: t("trust.zip", { days: DOWNLOAD_WINDOW_DAYS }) },
  ];

  return (
    <section
      id="pricing"
      className="relative scroll-mt-16 overflow-hidden bg-[linear-gradient(160deg,oklch(0.64_0.17_42)_0%,oklch(0.56_0.18_36)_55%,oklch(0.47_0.16_30)_100%)] px-4 py-24 text-white sm:py-28"
    >
      {/* soft light + dot texture */}
      <div
        aria-hidden
        className="absolute -start-40 -top-40 size-[34rem] rounded-full bg-[oklch(0.9_0.09_70/0.35)] blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -end-32 bottom-0 size-[28rem] rounded-full bg-[oklch(0.8_0.12_30/0.35)] blur-3xl"
      />
      <div
        aria-hidden
        className="absolute inset-0 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.12]"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium ring-1 ring-white/25 backdrop-blur">
            <Receipt className="size-4" aria-hidden />
            {t("eyebrow")}
          </span>
          <h2 className="mt-5 font-heading text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
            {t("title")}
          </h2>
          <p className="mt-5 text-lg text-pretty text-white/85">
            {t("subtitle")}
          </p>
        </div>

        <ol className="mx-auto grid max-w-3xl grid-cols-1 items-center gap-14 font-mono md:grid-cols-2 md:gap-8">
          {planOrder.map((id, i) => {
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
                {featured && <Seal text={upper(t("seal"))} center="1×" />}
                <div
                  className={cn(
                    "relative bg-[#fffdf9] px-6 pt-8 pb-8 text-[12.5px] leading-relaxed text-[oklch(0.23_0.02_40)] transition-transform duration-300 hover:-translate-y-1",
                    TORN_EDGE,
                    featured
                      ? "shadow-[0_40px_80px_-30px_rgb(40_10_0/0.7)] md:scale-[1.06] md:rotate-[1deg]"
                      : "shadow-[0_30px_60px_-30px_rgb(40_10_0/0.6)] md:-rotate-1",
                  )}
                >
                  <p className="text-center text-[13.5px] font-bold tracking-[0.1em]">
                    {upper(publicEnv.appName)}
                  </p>
                  <p className="mt-1 text-center text-[10.5px] tracking-[0.06em] text-[oklch(0.52_0.02_45)]">
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
                  <p className="mt-1 text-[11px] text-[oklch(0.52_0.02_45)]">
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
                        <span className="shrink-0 font-bold text-primary">
                          ✓
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Rule />
                  <div className="flex items-baseline justify-between text-[11.5px] text-[oklch(0.52_0.02_45)]">
                    <span>{t("billing")}</span>
                    <span>{t("oneTime")}</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-lg font-bold">{t("total")}</span>
                    <span
                      className={cn(
                        "font-heading text-5xl font-extrabold tracking-tight",
                        featured && "text-primary",
                      )}
                    >
                      {usd(p.priceUsd)}
                    </span>
                  </div>
                  <p className="mt-1 text-end text-[11px] text-[oklch(0.52_0.02_45)]">
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
                        : "bg-[oklch(0.23_0.02_40)] text-white hover:bg-[oklch(0.3_0.02_40)]",
                    )}
                  >
                    {upper(t(`plans.${id}.cta`))}
                    <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
                  </Link>
                  <div
                    aria-hidden
                    className="mx-auto mt-5 h-9 w-4/5 [background-image:repeating-linear-gradient(90deg,currentColor_0,currentColor_2px,transparent_2px,transparent_5px,currentColor_5px,currentColor_6px,transparent_6px,transparent_9px)] opacity-70"
                  />
                  <p className="mt-2 text-center text-[10px] tracking-[0.2em] text-[oklch(0.52_0.02_45)]">
                    {t("thanks", { no: String(i + 1).padStart(4, "0") })}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <ul className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-3 text-sm md:grid-cols-4">
          {trust.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2.5 rounded-2xl bg-white/12 px-4 py-3 ring-1 ring-white/20 backdrop-blur"
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="text-white/95">{label}</span>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-8 flex max-w-2xl items-center justify-center gap-2 text-center text-sm text-white/85">
          <QrCode className="size-4 shrink-0" aria-hidden />
          {t("howToPay")}
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-center text-xs text-white/65">
          {t("footnote")}
        </p>
      </div>
    </section>
  );
}
