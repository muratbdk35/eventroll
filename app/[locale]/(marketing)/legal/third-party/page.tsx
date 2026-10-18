import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import type { Locale } from "@/lib/i18n/routing";
import {
  adaptedComponents,
  fonts,
  libraries,
  licenseTexts,
  photos,
  type Notice,
} from "@/lib/legal/notices";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/legal/third-party">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Notices",
  });
  return { title: t("title") };
}

const linkCls =
  "font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground";

function License({ id }: { id: string }) {
  const href = licenseTexts[id];
  return href ? (
    <a href={href} className={linkCls} target="_blank" rel="noreferrer">
      {id}
    </a>
  ) : (
    <span className="font-medium text-foreground">{id}</span>
  );
}

function NoticeList({ items }: { items: Notice[] }) {
  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
      {items.map((n) => (
        <li key={n.name} className="px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <a
              href={n.url}
              className={linkCls}
              target="_blank"
              rel="noreferrer"
            >
              {n.name}
            </a>
            <span className="text-sm text-muted-foreground">
              <License id={n.license} />
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            © {n.author}. {n.usedFor}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default async function ThirdPartyPage({
  params,
}: PageProps<"/[locale]/legal/third-party">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Notices");

  return (
    <>
      <MarketingHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-16">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-pretty">{t("intro")}</p>

        <section className="mt-12">
          <h2 className="font-heading text-xl font-semibold">
            {t("components")}
          </h2>
          <p className="mt-2 mb-5 text-pretty text-muted-foreground">
            {t("componentsIntro")}
          </p>
          <NoticeList items={adaptedComponents} />
        </section>

        <section className="mt-12">
          <h2 className="font-heading text-xl font-semibold">
            {t("libraries")}
          </h2>
          <p className="mt-2 mb-5 text-pretty text-muted-foreground">
            {t("librariesIntro")}
          </p>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-x-6 rounded-2xl border border-border bg-card px-4 py-2 text-sm sm:grid-cols-2 sm:px-5">
            {libraries.map((l) => (
              <li
                key={l.name}
                className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2.5 last:border-0"
              >
                <a
                  href={l.url}
                  className="min-w-0 truncate text-foreground hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {l.name}{" "}
                  <span className="text-muted-foreground">{l.version}</span>
                </a>
                <span className="shrink-0 text-muted-foreground">
                  {l.license}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="font-heading text-xl font-semibold">{t("fonts")}</h2>
          <div className="mt-5">
            <NoticeList items={fonts} />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-heading text-xl font-semibold">{t("photos")}</h2>
          <p className="mt-2 text-pretty text-muted-foreground">
            {t.rich("photosText", {
              license: (chunks) => (
                <a
                  href={photos.url}
                  className={linkCls}
                  target="_blank"
                  rel="noreferrer"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {photos.ids.map((id, i) => (
              <li key={id}>
                <a
                  href={`https://unsplash.com/photos/${id}`}
                  className="inline-block rounded-full border border-border bg-card px-3 py-1 text-muted-foreground hover:text-foreground"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("photo", { n: i + 1 })}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="font-heading text-xl font-semibold">{t("texts")}</h2>
          <p className="mt-2 text-pretty text-muted-foreground">
            {t("textsIntro")}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {Object.keys(licenseTexts).map((id) => (
              <li key={id}>
                <License id={id} />
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
