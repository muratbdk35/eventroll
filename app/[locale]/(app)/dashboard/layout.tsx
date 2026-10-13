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
    <div className="app-ui flex min-h-dvh flex-1 flex-col bg-background">
      <TopBar
        user={{ name: user.name, email: user.email, image: user.image }}
      />
      {children}
    </div>
  );
}
