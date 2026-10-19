import { MapPin } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link } from "@/lib/i18n/navigation";
import { publicEnv } from "@/lib/public-env";

export async function SiteFooter() {
  const t = await getTranslations("Landing.footer");
  const nav = await getTranslations("Landing.nav");
  const locale = await getLocale();
  const linkCls =
    "text-muted-foreground transition-colors hover:text-foreground";

  return (
    <footer className="mt-12 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:py-14">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            {t("tagline")}
          </p>
          <div className="mt-6">
            <LocaleSwitcher />
          </div>
        </div>
        <div>
          <p className="font-heading font-semibold">{t("product")}</p>
          <ul className="mt-4 space-y-3 text-sm">
            {(["how-it-works", "features", "pricing", "faq"] as const).map(
              (id) => (
                <li key={id}>
                  <a href={`/${locale}#${id}`} className={linkCls}>
                    {nav(id)}
                  </a>
                </li>
              ),
            )}
          </ul>
        </div>
        <div>
          <p className="font-heading font-semibold">{t("legal")}</p>
          <ul className="mt-4 space-y-3 text-sm">
            {(
              [
                "privacy",
                "terms",
                "withdrawal",
                "cookies",
                "imprint",
                "dmca-report",
                "third-party",
              ] as const
            ).map((page) => (
              <li key={page}>
                <Link href={`/legal/${page}`} className={linkCls}>
                  {t(`links.${page}`)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/contact" className={linkCls}>
                {t("links.contact")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-border px-4 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>
          © {new Date().getFullYear()} {publicEnv.appName}
        </p>
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1">
          <MapPin className="size-3.5 text-primary" aria-hidden />
          {t("hosting")}
        </p>
      </div>
    </footer>
  );
}
