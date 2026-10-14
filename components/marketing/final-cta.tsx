import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { HaloButton } from "@/components/halo/halo-button";

/**
 * Closing note (DECISIONS #40): a large print left on the table, the photo on
 * one side and the invitation to start on the other. No gradient box.
 */
export async function FinalCta() {
  const t = await getTranslations("Landing.finalCta");
  return (
    <section className="px-4 py-20">
      <div className="mx-auto grid max-w-5xl -rotate-[0.6deg] gap-6 rounded-[6px] bg-white p-3 shadow-[0_2px_4px_rgb(20_35_60/0.06),0_40px_80px_-40px_rgb(20_35_60/0.45)] ring-1 ring-foreground/5 sm:p-4 md:grid-cols-[1.1fr_1fr] md:gap-10">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] bg-muted md:aspect-auto md:min-h-80">
          <Image
            src="/marketing/sparklers.jpg"
            alt=""
            fill
            sizes="(min-width: 768px) 540px, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center px-3 pb-5 md:px-0 md:py-8 md:pe-8">
          <h2 className="font-heading text-[2.2rem] leading-[1.05] font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-pretty text-muted-foreground">
            {t("body")}
          </p>
          <div className="mt-7">
            <HaloButton href="/login" size="lg">
              {t("cta")}
            </HaloButton>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t("note")}</p>
        </div>
      </div>
    </section>
  );
}
