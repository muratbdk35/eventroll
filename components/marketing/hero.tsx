import { Check, ImagePlus, Sparkles } from "lucide-react";
import { getImageProps } from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { HaloButton } from "@/components/halo/halo-button";
import { optimized } from "@/lib/images";
import { CURRENCY, LAUNCH_OFF, salePrice } from "@/lib/plans";

/**
 * Opening (DECISIONS #84): a real wedding photo edge to edge, guests holding
 * up their phones, with the promise, the price and one action over it. A
 * small "photos added" card hints at the product without covering the couple.
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

  const common = { alt: "", quality: 60, sizes: "100vw", priority: true };
  const {
    props: { srcSet: wideSrcSet },
  } = getImageProps({
    ...common,
    src: "/marketing/hero-guests.jpg",
    width: 1560,
    height: 760,
  });
  const { props: phone } = getImageProps({
    ...common,
    src: "/marketing/hero-guests-phone.jpg",
    width: 760,
    height: 1163,
  });

  return (
    <section className="relative isolate flex min-h-[calc(100svh-4rem)] overflow-hidden bg-[oklch(0.18_0.02_250)] text-white lg:min-h-[680px]">
      {/* Art direction: a portrait crop with the couple's faces up top on
          phones, a wide one with the couple on the right from 1024 px. */}
      <picture>
        <source media="(min-width: 1024px)" srcSet={wideSrcSet} />
        <img
          {...phone}
          alt=""
          className="absolute inset-0 -z-20 size-full object-cover object-top lg:object-[85%_40%]"
        />
      </picture>
      {/* Dark from the bottom on phones, from the left on wide screens, so
          the text always sits on a calm ground. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/45 to-black/10 lg:bg-gradient-to-r lg:from-black/80 lg:via-black/45 lg:to-black/5"
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col justify-end px-4 pt-24 pb-10 lg:justify-center lg:py-20">
        <div className="max-w-lg">
          {LAUNCH_OFF > 0 && (
            <a
              href="#pricing"
              className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[13px] font-medium backdrop-blur-md transition-colors hover:bg-white/25"
            >
              <Sparkles className="size-3.5" aria-hidden />
              {t("offer", { price: from })}
            </a>
          )}
          <h1 className="font-heading text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.02em] text-balance sm:text-6xl xl:text-[4.6rem]">
            {t("title1")} <span className="text-white/75">{t("title2")}</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-pretty text-white/80 sm:mt-6 sm:text-lg">
            {t("subhead")}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 sm:mt-9">
            <HaloButton href="/create" size="lg">
              {t("cta")}
            </HaloButton>
            <a
              href="#how-it-works"
              className="text-base font-medium underline decoration-white/40 underline-offset-[6px] transition-colors hover:decoration-white"
            >
              {t("secondary")}
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/80 sm:mt-8">
            {(["app", "quality", "once"] as const).map((k) => (
              <li key={k} className="flex items-center gap-1.5">
                <Check className="size-4 text-emerald-300" aria-hidden />
                {t(`points.${k}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Wide screens only: below that the couple needs the space. */}
      <div
        aria-hidden
        className="absolute end-8 bottom-10 hidden w-72 rounded-2xl border border-white/20 bg-white/15 p-3.5 shadow-2xl backdrop-blur-xl xl:end-[max(2rem,calc((100vw-72rem)/2))] xl:block"
      >
        <div className="flex items-center gap-2.5 text-sm font-medium">
          <span className="flex size-8 items-center justify-center rounded-full bg-white/20">
            <ImagePlus className="size-4" />
          </span>
          {t("card.added", { name: t("card.name"), count: 12 })}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {["toast.jpg", "cake.jpg", "sparklers.jpg"].map((f) => (
            // eslint-disable-next-line @next/next/no-img-element -- small decorative thumbs
            <img
              key={f}
              src={optimized(`/marketing/${f}`, 256)}
              alt=""
              className="aspect-square w-full rounded-lg object-cover"
            />
          ))}
        </div>
        <p className="mt-2.5 text-xs text-white/70">
          {t("card.album", { count: 248 })}
        </p>
      </div>
    </section>
  );
}
