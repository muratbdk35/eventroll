import { Check, Sparkles } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { HaloButton } from "@/components/halo/halo-button";
import { CURRENCY, LAUNCH_OFF, salePrice } from "@/lib/plans";
import { FilmStrip } from "./film-strip";
import { HeroVisual } from "./hero-visual";

/**
 * Opening (DECISIONS #40): the promise in large type, one action, the real
 * guest screen on the right, and a strip of film across the page whose frames
 * develop as it loads: the page's single orchestrated moment.
 */
export async function Hero() {
  const [t, format] = await Promise.all([
    getTranslations("Landing.hero"),
    getFormatter(),
  ]);
  const from = format.number(salePrice("mini"), {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  });

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-14 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div>
          {/* Visitors from ads see what it costs before they scroll (#81). */}
          {LAUNCH_OFF > 0 && (
            <a
              href="#pricing"
              className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-[13px] font-medium text-primary transition-colors hover:bg-primary/12 sm:mb-7"
            >
              <Sparkles className="size-3.5" aria-hidden />
              {t("offer", { price: from })}
            </a>
          )}
          <h1 className="font-heading text-4xl leading-[1.05] font-semibold tracking-[-0.02em] sm:text-6xl lg:text-[5.2rem] lg:leading-[0.98]">
            {t("line1")} {t("line2")}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-pretty text-muted-foreground sm:mt-7 sm:text-lg">
            {t("subhead")}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 sm:mt-9">
            <HaloButton href="/create" size="lg">
              {t("cta")}
            </HaloButton>
            <a
              href="#how-it-works"
              className="text-base font-medium underline decoration-foreground/25 underline-offset-[6px] transition-colors hover:decoration-foreground"
            >
              {t("secondary")}
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground sm:mt-8">
            {(["app", "quality", "once"] as const).map((k) => (
              <li key={k} className="flex items-center gap-1.5">
                <Check className="size-4 text-success" aria-hidden />
                {t(`points.${k}`)}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
      <FilmStrip />
    </section>
  );
}
