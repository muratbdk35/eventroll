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
        <div className="absolute -top-64 -left-56 size-[48rem] rounded-full bg-[radial-gradient(closest-side,oklch(0.57_0.175_38/0.13),transparent)]" />
        <div className="absolute -right-64 -bottom-72 size-[52rem] rounded-full bg-[radial-gradient(closest-side,oklch(0.86_0.1_65/0.4),transparent)]" />
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
