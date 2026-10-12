import { setRequestLocale } from "next-intl/server";
import { EventTypes } from "@/components/marketing/event-types";
import { Faq } from "@/components/marketing/faq";
import { FeaturesBento } from "@/components/marketing/features-bento";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { PricingReceipts } from "@/components/marketing/pricing-receipts";
import { SiteFooter } from "@/components/marketing/site-footer";
import type { Locale } from "@/lib/i18n/routing";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <>
      <MarketingHeader />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <FeaturesBento />
        <EventTypes />
        <PricingReceipts />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
