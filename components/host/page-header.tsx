import { ArrowLeft, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

/** Host app top bar: logo, "new event", avatar menu. No sidebar (owner decision). */
export async function TopBar({
  user,
}: {
  user: { name: string; email: string; image?: string | null };
}) {
  const t = await getTranslations("App");
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/55 shadow-[0_1px_0_rgb(0_0_0/0.03)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/dashboard" aria-label="EventRoll">
          <Logo className="[&_span]:text-lg [&_svg]:size-8" />
        </Link>
        <div className="flex items-center gap-3">
          <Button asChild className="h-9 rounded-full px-4">
            <Link href="/create" aria-label={t("newEvent")}>
              <Plus aria-hidden />
              <span className="hidden sm:inline">{t("newEvent")}</span>
            </Link>
          </Button>
          <UserMenu name={user.name} email={user.email} image={user.image} />
        </div>
      </div>
    </header>
  );
}

/** Standard content column for dashboard pages. */
export function PageBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-20 sm:px-6",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
      {children}
    </Link>
  );
}
