import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { env } from "@/lib/env";
import { routing, type Locale } from "@/lib/i18n/routing";
import { getLegalDoc, isLegalPage, legalPages } from "@/lib/legal/content";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    legalPages.map((page) => ({ locale, page })),
  );
}

function doc(page: string) {
  if (!isLegalPage(page)) notFound();
  return getLegalDoc(page, {
    appName: env.NEXT_PUBLIC_APP_NAME,
    supportEmail: env.SUPPORT_EMAIL ?? "[support email]",
  });
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/legal/[page]">): Promise<Metadata> {
  const { page } = await params;
  // DRAFT pages stay out of search results until reviewed.
  return { title: doc(page).title, robots: { index: false } };
}

export default async function LegalPage({
  params,
}: PageProps<"/[locale]/legal/[page]">) {
  const { locale, page } = await params;
  setRequestLocale(locale as Locale);
  const content = doc(page);
  const t = await getTranslations("Legal");

  return (
    <>
      <MarketingHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <p className="rounded-xl border border-dashed border-primary/40 bg-accent/60 px-4 py-3 text-sm text-accent-foreground">
          {t("draft")}
          {locale !== "en" && <> {t("englishOnly")}</>}
        </p>
        <h1 className="mt-10 font-heading text-4xl font-bold tracking-tight">
          {content.title}
        </h1>
        <div className="mt-8 space-y-10">
          {content.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-heading text-xl font-semibold">
                {s.heading}
              </h2>
              <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">
                {s.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
