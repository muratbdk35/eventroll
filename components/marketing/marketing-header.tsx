import { LogIn } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

export async function MarketingHeader() {
  const t = await getTranslations("Landing.nav");
  // Absolute so the anchors also work from other pages (e.g. legal).
  const locale = await getLocale();
  const nav = await getTranslations("Nav");
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/75 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4">
        {/* Under 360 px only the mark: the bar must fit the narrowest phones. */}
        <Link
          href="/"
          aria-label="Home"
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
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LocaleSwitcher className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-[13px]" />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden h-9 rounded-full px-3 text-sm sm:inline-flex"
          >
            <Link href="/login">{nav("login")}</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground sm:hidden"
          >
            <Link href="/login" aria-label={nav("login")} title={nav("login")}>
              <LogIn className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            className="h-8 shrink-0 rounded-lg px-2.5 text-xs font-semibold sm:h-9 sm:rounded-xl sm:px-4 sm:text-sm"
          >
            {/* Phones get the short word so the bar fits down to 320 px. */}
            <Link href="/create" aria-label={t("cta")}>
              <span className="sm:hidden">{t("ctaShort")}</span>
              <span className="hidden sm:inline">{t("cta")}</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
