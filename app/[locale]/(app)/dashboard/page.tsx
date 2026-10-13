import type { Metadata } from "next";
import { CalendarPlus, ChevronRight, Plus } from "lucide-react";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { UserMenu } from "@/components/host/user-menu";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { listOwnedEvents } from "@/lib/events/queries";
import { Link, redirect } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard");
  return { title: t("title"), robots: { index: false } };
}

export default async function DashboardPage({
  params,
}: PageProps<"/[locale]/dashboard">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) return redirect({ href: "/login", locale });

  const [t, te, format, events] = await Promise.all([
    getTranslations("Dashboard"),
    getTranslations("Events"),
    getFormatter(),
    listOwnedEvents(session.user.id),
  ]);
  const { user } = session;

  return (
    <>
      <SiteHeader>
        <UserMenu name={user.name} email={user.email} image={user.image} />
      </SiteHeader>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {t("greeting", { name: user.name || user.email })}
            </p>
            <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
          </div>
          {events.length > 0 && (
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/dashboard/new">
                <Plus aria-hidden />
                {t("createEvent")}
              </Link>
            </Button>
          )}
        </div>

        {events.length === 0 ? (
          <section className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <CalendarPlus className="size-7" aria-hidden />
            </span>
            <h2 className="font-heading text-xl font-semibold">
              {t("emptyTitle")}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("emptyBody")}
            </p>
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/dashboard/new">{t("createEvent")}</Link>
            </Button>
          </section>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/dashboard/events/${e.id}`}
                  className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-heading text-lg leading-snug font-semibold text-balance">
                      {e.name}
                    </h2>
                    <ChevronRight
                      className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
                      aria-hidden
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {te(`types.${e.type}`)} ·{" "}
                    {format.dateTime(new Date(`${e.eventDate}T12:00:00Z`), {
                      dateStyle: "medium",
                      timeZone: "UTC",
                    })}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-sm">
                    <Badge
                      variant={e.status === "active" ? "default" : "secondary"}
                    >
                      {te(`status.${e.status}`)}
                    </Badge>
                    <span className="text-muted-foreground">
                      {te("photoCount", { count: e.mediaCount })}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
