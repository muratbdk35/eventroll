import { getTranslations } from "next-intl/server";
import { HaloButton } from "@/components/halo/halo-button";
import { FilmStrip } from "./film-strip";
import { HeroVisual } from "./hero-visual";

/**
 * Opening (DECISIONS #40): the promise in large type, one action, the real
 * guest screen on the right, and a strip of film across the page whose frames
 * develop as it loads: the page's single orchestrated moment.
 */
export async function Hero() {
  const t = await getTranslations("Landing.hero");

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-14 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div>
          <h1 className="font-heading text-[3.4rem] leading-[0.95] font-semibold tracking-[-0.02em] sm:text-7xl lg:text-[5.4rem]">
            {t("line1")} {t("line2")}
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-pretty text-muted-foreground">
            {t("subhead")}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
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
        </div>

        <HeroVisual />
      </div>
      <FilmStrip />
    </section>
  );
}
