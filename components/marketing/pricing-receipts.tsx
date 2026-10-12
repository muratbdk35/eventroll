import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { planOrder, plans, type PlanId } from "@/lib/plans";
import { publicEnv } from "@/lib/public-env";
import { cn } from "@/lib/utils";

// Layout adapted from 21st.dev "Receipt Tiers" (arihantcodes), restyled with
// our tokens, server-rendered and animated with CSS only.

// Torn thermal-paper bottom edge.
const TORN_EDGE =
  "[clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),97%_100%,94%_calc(100%-8px),91%_100%,88%_calc(100%-8px),85%_100%,82%_calc(100%-8px),79%_100%,76%_calc(100%-8px),73%_100%,70%_calc(100%-8px),67%_100%,64%_calc(100%-8px),61%_100%,58%_calc(100%-8px),55%_100%,52%_calc(100%-8px),49%_100%,46%_calc(100%-8px),43%_100%,40%_calc(100%-8px),37%_100%,34%_calc(100%-8px),31%_100%,28%_calc(100%-8px),25%_100%,22%_calc(100%-8px),19%_100%,16%_calc(100%-8px),13%_100%,10%_calc(100%-8px),7%_100%,4%_calc(100%-8px),1%_100%,0_calc(100%-8px))]";

const TILTS = [
  "md:-rotate-1",
  "md:rotate-[0.5deg] md:-translate-y-3",
  "md:rotate-[1.5deg]",
];

function Rule() {
  return (
    <span
      aria-hidden
      className="my-3 block border-t border-dashed border-border"
    />
  );
}

export async function PricingReceipts() {
  const t = await getTranslations("Landing.pricing");
  const format = await getFormatter();
  const locale = await getLocale();
  // Locale-aware so Turkish gets "İ" rather than "I".
  const upper = (s: string) => s.toLocaleUpperCase(locale);
  const appName = upper(publicEnv.appName);

  const lines = (id: PlanId): string[] => {
    const p = plans[id];
    const out = [
      id === "free"
        ? t("lines.photos", { count: p.maxItems })
        : t("lines.items", {
            count: format.number(p.maxItems),
            gb: p.maxBytes / 1024 ** 3,
          }),
      p.allowVideo
        ? t("lines.video", { minutes: p.maxVideoSeconds / 60 })
        : t("lines.noVideo"),
      t("lines.retention", { days: p.retentionDays }),
      p.fullZip ? t("lines.zip") : t("lines.zipPreview"),
      p.customColors
        ? t("lines.templatesCustom")
        : p.allTemplates
          ? t("lines.templatesAll")
          : t("lines.templatesBasic"),
    ];
    if (p.liveSlideshow) out.push(t("lines.slideshow"));
    if (p.removeBranding) out.push(t("lines.removeBranding"));
    out.push(
      p.prioritySupport ? t("lines.prioritySupport") : t("lines.support"),
    );
    return out;
  };

  return (
    <section id="pricing" className="scroll-mt-20 px-4 py-24">
      <div className="mx-auto max-w-6xl rounded-[2rem] bg-secondary px-5 py-16 sm:px-10">
        <div className="mx-auto mb-14 max-w-xl text-center font-mono">
          <span className="text-[11px] tracking-[0.3em] text-muted-foreground">
            ··· {upper(t("eyebrow"))} ···
          </span>
          <h2 className="mt-4 font-heading text-3xl font-bold text-balance sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 font-sans text-pretty text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <ol className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-10 font-mono md:grid-cols-3 md:gap-7">
          {planOrder.map((id, i) => {
            const p = plans[id];
            const featured = id === "standard";
            const price = format.number(p.priceUsd, {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            });
            return (
              <li
                key={id}
                style={{ animationDelay: `${i * 120}ms` }}
                className={cn(
                  "receipt-in relative bg-card px-6 pt-8 pb-8 text-[12.5px] leading-relaxed text-card-foreground shadow-[0_18px_40px_-20px_rgb(60_30_10/0.45)] transition-transform duration-300 hover:-translate-y-1 hover:rotate-0",
                  TORN_EDGE,
                  TILTS[i],
                )}
              >
                {featured && (
                  <span
                    aria-hidden
                    className="absolute end-3 top-[5.75rem] -rotate-12 rounded border-2 border-primary bg-card/60 px-2 py-1 text-[11px] font-bold tracking-[0.14em] text-primary opacity-85"
                  >
                    {upper(t("stamp"))}
                  </span>
                )}
                <p className="text-center text-[13.5px] font-bold tracking-[0.1em]">
                  {appName}
                </p>
                <p className="mt-1 text-center text-[10.5px] tracking-[0.06em] text-muted-foreground">
                  {t("merchantLine")}
                </p>
                <Rule />
                <div className="flex items-baseline justify-between">
                  <h3 className="font-bold tracking-[0.08em]">
                    {upper(t(`plans.${id}.name`))}
                  </h3>
                  <span className="text-muted-foreground">×1</span>
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
                        {t("incl")}
                      </span>
                    </li>
                  ))}
                </ul>
                <Rule />
                <div className="flex items-baseline justify-between text-[11.5px] text-muted-foreground">
                  <span>{t("billing")}</span>
                  <span>{id === "free" ? "—" : t("oneTime")}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between text-lg font-bold">
                  <span>{t("total")}</span>
                  <span className={cn(featured && "text-primary")}>
                    {price}
                  </span>
                </div>
                <Rule />
                <Link
                  href="/login"
                  className={cn(
                    "block w-full py-3 text-center text-[12.5px] font-bold tracking-[0.1em] transition-transform active:scale-[0.98]",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                    featured
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-foreground text-background hover:bg-foreground/90",
                  )}
                >
                  {upper(t(`plans.${id}.cta`))}
                </Link>
                <div
                  aria-hidden
                  className="mx-auto mt-5 h-9 w-4/5 [background-image:repeating-linear-gradient(90deg,currentColor_0,currentColor_2px,transparent_2px,transparent_5px,currentColor_5px,currentColor_6px,transparent_6px,transparent_9px)] opacity-70"
                />
                <p className="mt-2 text-center text-[10px] tracking-[0.2em] text-muted-foreground">
                  {t("thanks", { no: String(i + 1).padStart(4, "0") })}
                </p>
              </li>
            );
          })}
        </ol>

        <p className="mx-auto mt-12 max-w-2xl text-center text-sm text-muted-foreground">
          {t("footnote")}
        </p>
      </div>
    </section>
  );
}
