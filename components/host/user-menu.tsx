"use client";

import { Check, Globe, House, LogOut } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";

const localeLabels: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
};

/** Avatar menu: account, language and sign-out in one place. */
export function UserMenu({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image?: string | null;
}) {
  const t = useTranslations("Nav");
  const tApp = useTranslations("App");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const [, start] = useTransition();
  const initials = (name || email).slice(0, 1).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("account")}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Avatar className="size-9 ring-2 ring-background">
          {image && <AvatarImage src={image} alt="" />}
          <AvatarFallback className="bg-accent font-semibold text-accent-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">
            {name || email}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
          <Globe className="size-3.5" aria-hidden />
          {t("language")}
        </DropdownMenuLabel>
        {routing.locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onSelect={() =>
              start(() => router.replace(pathname, { locale: l }))
            }
          >
            <span className="flex-1">{localeLabels[l]}</span>
            {l === locale && <Check className="size-4" aria-hidden />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/">
            <House aria-hidden />
            {tApp("home")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            await authClient.signOut();
            router.replace("/");
            router.refresh();
          }}
        >
          <LogOut aria-hidden />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
