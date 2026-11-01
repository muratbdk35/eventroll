import { Check, Sparkles } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { HaloButton } from "@/components/halo/halo-button";
import { CURRENCY, LAUNCH_OFF, salePrice } from "@/lib/plans";
import { BackgroundPaths } from "./background-paths";
import { HeroVisual } from "./hero-visual";

/**
 * Opening (DECISIONS #84): the promise, the launch price and one action on
 * the left, the real guest screen on the right, over a ribbon of slowly
 * flowing lines in our powder blue (Kokonut UI Background Paths).
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
    <section className="relative isolate overflow-hidden">
      <BackgroundPaths
        className="-z-10 text-primary"
        count={36}
        angle={-10}
        speed={0.6}
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-14 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div>
          {LAUNCH_OFF > 0 && (
            <a
              href="#pricing"
              className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-[13px] font-medium text-primary backdrop-blur-sm transition-colors hover:bg-primary/10 sm:mb-7"
            >
              <Sparkles className="size-3.5" aria-hidden />
              {t("offer", { price: from })}
            </a>
          )}
          <h1 className="font-heading text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.02em] text-balance sm:text-6xl xl:text-[4.6rem]">
            {t("title1")} <span className="text-primary">{t("title2")}</span>
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
    </section>
  );
}
