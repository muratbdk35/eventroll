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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" aria-label="Home" className="shrink-0">
          {/* Mark only on the narrowest phones, so language + CTA still fit. */}
          <Logo className="max-[399px]:[&>span]:hidden" />
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
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LocaleSwitcher />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">{nav("login")}</Link>
          </Button>
          {/* Phones: no room for the word, but returning hosts still need a way in. */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 rounded-full sm:hidden"
          >
            <Link href="/login" aria-label={nav("login")} title={nav("login")}>
              <LogIn aria-hidden />
            </Link>
          </Button>
          <Button asChild className="h-9 shrink-0 rounded-xl px-3 text-[13px] sm:h-10 sm:px-4 sm:text-sm">
            <Link href="/create">{t("cta")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
