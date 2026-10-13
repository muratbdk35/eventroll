import type { Metadata } from "next";
import { ChevronRight, Plus } from "lucide-react";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { EventIcon } from "@/components/host/event-icon";
import { PageBody } from "@/components/host/page-header";
import { StatusPill } from "@/components/host/status-pill";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { listOwnedEvents } from "@/lib/events/queries";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard");
  return { title: t("eventsTitle"), robots: { index: false } };
}

export default async function DashboardPage({
  params,
}: PageProps<"/[locale]/dashboard">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  // The layout already redirects signed-out visitors.
  const session = (await getSession())!;

  const [t, te, format, events] = await Promise.all([
    getTranslations("Dashboard"),
    getTranslations("Events"),
    getFormatter(),
    listOwnedEvents(session.user.id),
  ]);
  const firstName = (session.user.name || session.user.email).split(/[\s@]/)[0];
  const date = (d: string) =>
    format.dateTime(new Date(`${d}T12:00:00Z`), {
      dateStyle: "long",
      timeZone: "UTC",
    });

  return (
    <PageBody>
      <p className="text-sm text-muted-foreground">
        {t("greeting", { name: firstName })}
      </p>
      <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight">
        {t("eventsTitle")}
      </h1>

      {events.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-12">
          <EventIcon type="party" className="mx-auto size-14" />
          <h2 className="mt-5 font-heading text-xl font-semibold">
            {t("emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-pretty text-muted-foreground">
            {t("emptyBody")}
          </p>
          <Button asChild size="lg" className="mt-6 h-11 rounded-full px-6">
            <Link href="/dashboard/new">
              <Plus aria-hidden />
              {t("createEvent")}
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {events.map((e) => (
            <li key={e.id}>
              <Link
                href={`/dashboard/events/${e.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none sm:p-5"
              >
                <EventIcon type={e.type} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-heading text-lg font-semibold">
                    {e.name}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                    {date(e.eventDate)} ·{" "}
                    {te("photoCount", { count: e.mediaCount })}
                  </span>
                </span>
                <StatusPill
                  status={e.status}
                  label={te(`status.${e.status}`)}
                  className="hidden sm:inline-flex"
                />
                <ChevronRight
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageBody>
  );
}
