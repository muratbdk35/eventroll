import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/marketing/contact-form";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import type { Locale } from "@/lib/i18n/routing";
import { publicEnv } from "@/lib/public-env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Contact");
  return { title: t("title") };
}

export default async function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  setRequestLocale((await params).locale as Locale);
  const t = await getTranslations("Contact");
  return (
    <>
      <MarketingHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-16">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 mb-8 text-lg leading-relaxed text-pretty text-muted-foreground">
          {t("subtitle")}
        </p>
        <ContactForm siteKey={publicEnv.turnstileSiteKey} />
      </main>
      <SiteFooter />
    </>
  );
}
