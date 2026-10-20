import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { env } from "@/lib/env";
import { Link } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
import { getLegalDoc, isLegalPage, legalPages } from "@/lib/legal/content";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    legalPages.map((page) => ({ locale, page })),
  );
}

function doc(page: string, locale: string) {
  if (!isLegalPage(page)) notFound();
  return getLegalDoc(
    page,
    {
      appName: env.NEXT_PUBLIC_APP_NAME,
      supportEmail: env.SUPPORT_EMAIL ?? "[support email]",
      appUrl: env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""),
    },
    locale,
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/legal/[page]">): Promise<Metadata> {
  const { page, locale } = await params;
  // DRAFT pages stay out of search results until reviewed.
  return { title: doc(page, locale).title, robots: { index: false } };
}

export default async function LegalPage({
  params,
}: PageProps<"/[locale]/legal/[page]">) {
  const { locale, page } = await params;
  setRequestLocale(locale as Locale);
  const content = doc(page, locale);
  const t = await getTranslations("Legal");

  return (
    <>
      <MarketingHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-16">
        <p className="rounded-xl border border-dashed border-primary/40 bg-accent/60 px-4 py-3 text-sm text-accent-foreground">
          {t("draft")}
        </p>
        {/* Only the German text is binding (DECISIONS #68). */}
        {locale !== "de" && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("translation")}{" "}
            <Link
              href={`/legal/${page}`}
              locale="de"
              className="font-medium text-primary underline underline-offset-2"
            >
              {t("german")}
            </Link>
          </p>
        )}
        <h1 className="mt-10 font-heading text-3xl font-bold tracking-tight [overflow-wrap:anywhere] hyphens-auto sm:text-4xl">
          {content.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("updated", { date: content.updated })}
        </p>
        {content.intro && (
          <p className="mt-6 text-lg leading-relaxed text-pretty">
            {content.intro}
          </p>
        )}
        <div className="mt-10 space-y-10">
          {content.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-heading text-xl font-semibold">
                {s.heading}
              </h2>
              <div className="mt-3 space-y-3 leading-relaxed text-pretty [overflow-wrap:anywhere] hyphens-auto text-muted-foreground">
                {s.body.map((block, i) =>
                  typeof block === "string" ? (
                    <p key={i}>{block}</p>
                  ) : (
                    <ul key={i} className="list-disc space-y-2 ps-5">
                      {block.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
