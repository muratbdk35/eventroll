import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { WithdrawForm } from "@/components/marketing/withdraw-form";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { publicEnv } from "@/lib/public-env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Withdraw");
  return { title: t("title") };
}

/** The online withdrawal function (§ 356a BGB, DECISIONS #71). */
export default async function WithdrawPage({
  params,
}: PageProps<"/[locale]/withdraw">) {
  setRequestLocale((await params).locale as Locale);
  const t = await getTranslations("Withdraw");
  return (
    <>
      <MarketingHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-16">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 mb-8 text-lg leading-relaxed text-pretty text-muted-foreground">
          {t.rich("subtitle", {
            link: (c) => (
              <Link
                href="/legal/withdrawal"
                className="underline underline-offset-2 hover:text-foreground"
              >
                {c}
              </Link>
            ),
          })}
        </p>
        <WithdrawForm siteKey={publicEnv.turnstileSiteKey} />
      </main>
      <SiteFooter />
    </>
  );
}
