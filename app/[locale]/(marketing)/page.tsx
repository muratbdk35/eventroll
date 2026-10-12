import { ArrowRight, QrCode } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

// Placeholder landing page; the full marketing site is built in phase 1D.
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Home");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground">
          <QrCode className="size-4" aria-hidden />
          {t("eyebrow")}
        </span>
        <h1 className="font-heading text-5xl font-bold tracking-tight text-balance sm:text-6xl">
          {t("headline")}
        </h1>
        <p className="max-w-xl text-lg text-pretty text-muted-foreground">
          {t("subhead")}
        </p>
        <Button asChild size="lg" className="h-12 rounded-xl px-6 text-base">
          <Link href="/login">
            {t("cta")}
            <ArrowRight className="rtl:rotate-180" aria-hidden />
          </Link>
        </Button>
      </main>
    </>
  );
}
