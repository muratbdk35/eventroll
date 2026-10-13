import { setRequestLocale } from "next-intl/server";
import { AppSidebar } from "@/components/host/app-sidebar";
import { eventVisuals } from "@/components/host/event-visuals";
import { getSession } from "@/lib/auth";
import { listOwnedEvents } from "@/lib/events/queries";
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

  const events = await listOwnedEvents(session.user.id);
  const { user } = session;

  return (
    <div className="app-ui flex min-h-dvh flex-1 flex-col bg-[oklch(0.975_0.004_75)] md:flex-row">
      <AppSidebar
        user={{ name: user.name, email: user.email, image: user.image }}
        events={events.slice(0, 12).map((e) => ({
          id: e.id,
          name: e.name,
          status: e.status,
          cover: eventVisuals[e.type].cover,
        }))}
      />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
