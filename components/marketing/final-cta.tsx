import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

export async function FinalCta() {
  const t = await getTranslations("Landing.finalCta");
  return (
    <section className="px-4 py-16">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[oklch(0.62_0.16_42)] via-primary to-[oklch(0.42_0.13_30)] px-6 py-16 text-center text-white sm:px-12">
        <div
          aria-hidden
          className="absolute -start-20 -top-24 size-72 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute -end-16 -bottom-28 size-80 rounded-full bg-[oklch(0.85_0.1_70/0.35)] blur-3xl"
        />
        <h2 className="relative mx-auto max-w-2xl font-heading text-3xl font-bold text-balance sm:text-5xl">
          {t("title")}
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/85">
          {t("body")}
        </p>
        <Button
          asChild
          size="lg"
          className="relative mt-8 h-12 rounded-xl bg-white px-6 text-base text-[oklch(0.35_0.1_35)] hover:bg-white/90"
        >
          <Link href="/login">
            {t("cta")}
            <ArrowRight className="rtl:rotate-180" aria-hidden />
          </Link>
        </Button>
        <p className="relative mt-4 text-sm text-white/75">{t("note")}</p>
      </div>
    </section>
  );
}
