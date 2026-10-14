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
    <div className="app-ui grain relative flex min-h-dvh flex-1 flex-col bg-[oklch(0.975_0.012_70)]">
      {/* Same ambient light as the guest page, a little quieter. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="glow-drift absolute -top-48 -left-40 size-[36rem] rounded-full bg-primary/15 blur-[120px]" />
        <div className="glow-drift absolute -right-48 -bottom-56 size-[40rem] rounded-full bg-[oklch(0.86_0.1_65)]/40 blur-[130px] [animation-delay:-7s]" />
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
