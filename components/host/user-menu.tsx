"use client";

import { House, LayoutGrid, LogOut, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { localeLabels, useSwitchLocale } from "@/components/locale-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

/** Avatar menu: account card, navigation, language and sign-out. */
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
  const locale = useLocale() as Locale;
  const { switchTo, pending } = useSwitchLocale();
  const initials = (name || email).slice(0, 1).toUpperCase();

  const avatar = (size: string) => (
    <Avatar className={size}>
      {image && <AvatarImage src={image} alt="" />}
      <AvatarFallback className="bg-gradient-to-br from-primary/90 to-[oklch(0.68_0.065_242)] font-semibold text-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
  const item = "h-10 gap-3 rounded-xl px-3 text-[14px]";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("account")}
        className="rounded-full ring-2 ring-white/80 transition-transform outline-none hover:scale-105 focus-visible:ring-ring/50 active:scale-95"
      >
        {avatar("size-9")}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(18rem,calc(100vw-2rem))] rounded-2xl p-2 shadow-2xl shadow-black/10"
      >
        <div className="mb-1 flex items-center gap-3 rounded-xl bg-gradient-to-br from-accent/80 to-accent/30 p-3">
          {avatar("size-11 ring-2 ring-white")}
          <div className="min-w-0">
            <p className="truncate font-heading text-[15px] font-semibold">
              {name || email.split("@")[0]}
            </p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>

        <DropdownMenuGroup className="py-1">
          <DropdownMenuItem asChild className={item}>
            <Link href="/dashboard">
              <LayoutGrid aria-hidden />
              {tApp("yourEvents")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={item}>
            <Link href="/create">
              <Plus aria-hidden />
              {tApp("newEvent")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={item}>
            <Link href="/">
              <House aria-hidden />
              {tApp("home")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="mx-1" />

        <div className="px-1 py-2">
          <p className="px-2 pb-2 text-xs font-medium text-muted-foreground">
            {t("language")}
          </p>
          <div
            role="radiogroup"
            aria-label={t("language")}
            className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1"
          >
            {routing.locales.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={l === locale}
                title={localeLabels[l]}
                disabled={pending}
                onClick={() => l !== locale && switchTo(l)}
                className={cn(
                  "h-8 rounded-lg text-xs font-semibold uppercase transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  l === locale
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator className="mx-1" />

        <DropdownMenuItem
          className={cn(
            item,
            "mt-1 text-destructive focus:bg-destructive/10 focus:text-destructive [&_svg]:text-destructive",
          )}
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
