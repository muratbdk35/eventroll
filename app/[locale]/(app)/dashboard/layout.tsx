import { setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/host/page-header";
import { getSession } from "@/lib/auth";
import { redirect } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

export default async function DashboardLayout({
  children,
  params,
}: LayoutProps<"/[locale]/dashboard">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) return redirect({ href: "/login", locale });
  const { user } = session;

  return (
    <div className="app-ui relative flex min-h-dvh flex-1 flex-col bg-[oklch(0.975_0.012_70)]">
      {/* Ambient light like the guest page, but static: drifting 120px blurs
          behind frosted surfaces made phones repaint every frame. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-48 -left-40 size-[36rem] rounded-full bg-primary/15 blur-[100px]" />
        <div className="absolute -right-48 -bottom-56 size-[40rem] rounded-full bg-[oklch(0.86_0.1_65)]/40 blur-[100px]" />
      </div>
      <div className="relative flex flex-1 flex-col">
        <TopBar
          user={{ name: user.name, email: user.email, image: user.image }}
        />
        {children}
      </div>
    </div>
  );
}
