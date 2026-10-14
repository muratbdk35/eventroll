"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
};

/** Switches the page language in place; returns false if the guest cancels. */
export function useSwitchLocale() {
  const t = useTranslations("Nav");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const switchTo = (next: Locale) => {
    // Guest page: picked-but-unsent photos would be lost on navigation.
    if (
      document.documentElement.dataset.pendingPhotos &&
      !window.confirm(t("leaveWarning"))
    ) {
      return;
    }
    start(() => router.replace(pathname, { locale: next }));
  };
  return { switchTo, pending };
}

/**
 * Compact language menu (globe + code), small enough for phone headers.
 * `glass` is the frosted variant used over the guest page cover.
 */
export function LocaleSwitcher({
  variant = "default",
  className,
}: {
  variant?: "default" | "glass";
  className?: string;
}) {
  const t = useTranslations("Nav");
  const locale = useLocale() as Locale;
  const { switchTo, pending } = useSwitchLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        aria-label={`${t("language")}: ${localeLabels[locale]}`}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60",
          variant === "glass"
            ? "border border-white/25 bg-white/15 text-white backdrop-blur-md hover:bg-white/25"
            : "border border-border bg-card text-foreground hover:bg-accent",
          className,
        )}
      >
        <Globe className="size-4 opacity-80" aria-hidden />
        <span className="uppercase">{locale}</span>
        <ChevronDown className="size-3.5 opacity-60" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl p-1.5">
        {routing.locales.map((l) => (
          <DropdownMenuItem
            key={l}
            lang={l}
            onSelect={() => l !== locale && switchTo(l)}
            className="h-10 rounded-lg px-2.5"
          >
            <span className="w-6 text-xs font-semibold text-muted-foreground uppercase">
              {l}
            </span>
            <span className="flex-1">{localeLabels[l]}</span>
            {l === locale && (
              <Check className="size-4 text-primary" aria-hidden />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
