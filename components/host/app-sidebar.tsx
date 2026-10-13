"use client";

import {
  Check,
  ChevronsUpDown,
  Globe,
  LayoutGrid,
  LogOut,
  Menu,
  Plus,
  X,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Logo } from "@/components/brand/logo";
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
import { cn } from "@/lib/utils";

// Adapted from the 21st.dev "Sidebar" (wensity): 13.5px items, 6% active
// surface, small uppercase section labels, user footer. No motion deps.

export type SidebarEvent = {
  id: string;
  name: string;
  cover: string;
  status: "draft" | "active" | "expired" | "deleted" | "suspended";
};

type Props = {
  events: SidebarEvent[];
  user: { name: string; email: string; image?: string | null };
};

const localeLabels: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
};

const itemClass =
  "group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] font-medium leading-none whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50";

function NavItem({
  href,
  active,
  icon,
  children,
  trailing,
  onNavigate,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
  trailing?: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        itemClass,
        active
          ? "bg-foreground/[0.06] text-foreground"
          : "text-foreground/70 hover:bg-foreground/[0.04] hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center",
          active
            ? "text-foreground"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing}
    </Link>
  );
}

function SidebarBody({
  events,
  user,
  onNavigate,
}: Props & { onNavigate?: () => void }) {
  const t = useTranslations("App");
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center px-4">
        <Link href="/dashboard" onClick={onNavigate} aria-label="EventRoll">
          <Logo className="[&_span]:text-[15px] [&_svg]:size-7" />
        </Link>
      </div>

      <div className="px-3 pt-1 pb-3">
        <Link
          href="/dashboard/new"
          onClick={onNavigate}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-foreground text-[13px] font-medium text-background shadow-xs transition-colors hover:bg-foreground/88 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Plus className="size-4" aria-hidden />
          {t("newEvent")}
        </Link>
      </div>

      <nav
        aria-label={t("menu")}
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-3"
      >
        <div className="flex flex-col gap-px">
          <NavItem
            href="/dashboard"
            active={pathname === "/dashboard"}
            icon={<LayoutGrid className="size-[17px]" strokeWidth={1.75} />}
            onNavigate={onNavigate}
          >
            {t("events")}
          </NavItem>
        </div>

        {events.length > 0 && (
          <div className="mt-5">
            <p className="px-2.5 pb-1.5 text-[10.5px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              {t("yourEvents")}
            </p>
            <div className="flex flex-col gap-px">
              {events.map((e) => (
                <NavItem
                  key={e.id}
                  href={`/dashboard/events/${e.id}`}
                  active={pathname.startsWith(`/dashboard/events/${e.id}`)}
                  onNavigate={onNavigate}
                  icon={
                    <span className="relative size-5 overflow-hidden rounded-[5px] bg-muted">
                      <Image
                        src={e.cover}
                        alt=""
                        fill
                        sizes="20px"
                        className="object-cover"
                      />
                    </span>
                  }
                  trailing={
                    e.status === "active" ? (
                      <span
                        className="size-1.5 shrink-0 rounded-full bg-success"
                        aria-hidden
                      />
                    ) : null
                  }
                >
                  {e.name}
                </NavItem>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="shrink-0 border-t border-border p-2">
        <UserButton user={user} />
      </div>
    </div>
  );
}

function UserButton({ user }: Pick<Props, "user">) {
  const tNav = useTranslations("Nav");
  const tApp = useTranslations("App");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const [, start] = useTransition();
  const initial = (user.name || user.email).slice(0, 1).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg p-2 text-start outline-none hover:bg-foreground/[0.04] focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-foreground/[0.06]">
        <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              fill
              sizes="28px"
              className="object-cover"
            />
          ) : (
            initial
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] leading-tight font-medium">
            {user.name || user.email}
          </span>
          <span className="block truncate text-[11px] leading-tight text-muted-foreground">
            {user.email}
          </span>
        </span>
        <ChevronsUpDown
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
      >
        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
          <Globe className="size-3.5" aria-hidden />
          {tNav("language")}
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
          <Link href="/">{tApp("home")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            await authClient.signOut();
            router.replace("/");
            router.refresh();
          }}
        >
          <LogOut aria-hidden />
          {tNav("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Desktop: fixed 232px rail. Mobile: top bar with a slide-in drawer. */
export function AppSidebar(props: Props) {
  const t = useTranslations("App");
  // Closed by `onNavigate` when a link in the drawer is followed.
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 border-e border-border bg-background md:block">
        <SidebarBody {...props} />
      </aside>

      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur md:hidden">
        <Link href="/dashboard" aria-label="EventRoll">
          <Logo className="[&_span]:text-[15px] [&_svg]:size-7" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("menu")}
          aria-expanded={open}
          className="flex size-9 items-center justify-center rounded-lg hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t("menu")}
        >
          <button
            type="button"
            aria-label={t("closeMenu")}
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 start-0 w-[280px] bg-background shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("closeMenu")}
              className="absolute end-3 top-3 z-10 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/[0.05]"
            >
              <X className="size-4" aria-hidden />
            </button>
            <SidebarBody {...props} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
