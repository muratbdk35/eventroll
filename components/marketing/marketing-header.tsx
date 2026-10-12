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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>
        <nav
          className="hidden items-center gap-1 text-sm md:flex"
          aria-label="Main"
        >
          {(["how-it-works", "features", "pricing", "faq"] as const).map(
            (id) => (
              <a
                key={id}
                href={`/${locale}#${id}`}
                className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {t(id)}
              </a>
            ),
          )}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">{nav("login")}</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/login">{t("cta")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
