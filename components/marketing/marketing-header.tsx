import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { publicEnv } from "@/lib/public-env";

export async function MarketingHeader() {
  const t = await getTranslations("Landing.nav");
  // Absolute so the anchors also work from other pages (e.g. legal).
  const locale = await getLocale();
  const nav = await getTranslations("Nav");
  return (
    <header
      data-track="header"
      className="sticky top-0 z-50 border-b border-border/50 bg-background/75 backdrop-blur-lg"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4">
        {/* Under 360 px only the mark: the bar must fit the narrowest phones. */}
        <Link
          href="/"
          aria-label={publicEnv.appName}
          className="shrink-0 max-[359px]:[&>span>span]:hidden"
        >
          <Logo />
        </Link>
        {/* From 1024 px: on a portrait tablet the four links and the
            buttons don't fit one bar (German least of all). */}
        <nav
          className="hidden items-center gap-1 text-sm lg:flex"
          aria-label="Main"
        >
          {(["how-it-works", "features", "pricing", "faq"] as const).map(
            (id) => (
              <a
                key={id}
                href={`/${locale}#${id}`}
                className="rounded-lg px-3 py-2 whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {t(id)}
              </a>
            ),
          )}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Phones (#87): language, prices and log in; "Create" is the big
              button right under the bar. */}
          <LocaleSwitcher
            variant="plain"
            className="h-9 px-2 text-sm lg:hidden"
          />
          <a
            href={`/${locale}#pricing`}
            className="rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            {t("pricing")}
          </a>
          <LocaleSwitcher
            variant="plain"
            className="hidden h-9 text-[13px] lg:inline-flex"
          />
          {/* A word, not an icon: returning hosts must find it at a glance. */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 shrink-0 rounded-full px-4 text-sm font-semibold text-foreground lg:rounded-xl lg:border-transparent lg:bg-transparent lg:px-3 lg:shadow-none lg:hover:bg-accent"
          >
            <Link href="/login">{nav("login")}</Link>
          </Button>
          <Button
            asChild
            className="hidden h-9 shrink-0 rounded-xl px-4 text-sm font-semibold lg:inline-flex"
          >
            <Link href="/create">{t("cta")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
