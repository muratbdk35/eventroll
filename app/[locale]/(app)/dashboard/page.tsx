import type { Metadata } from "next";
import { Plus } from "lucide-react";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { EventCard } from "@/components/host/event-card";
import { PageBody } from "@/components/host/page-header";
import { PhotoStack } from "@/components/host/photo-stack";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { latestPhotoKeys, listOwnedEvents } from "@/lib/events/queries";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { presignGet } from "@/lib/storage";

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
  const latest = await latestPhotoKeys(events.map((e) => e.id));
  const stacks = await Promise.all(
    events.map((e) =>
      Promise.all((latest.get(e.id) ?? []).map((k) => presignGet(k))),
    ),
  );
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
      <h1 className="mt-1 font-heading text-4xl font-bold tracking-tight">
        {t("eventsTitle")}
      </h1>

      {events.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-[2rem] border border-white/70 bg-card/80 p-10 text-center shadow-xl ring-1 shadow-primary/5 ring-black/5">
          <PhotoStack srcs={[]} type="party" className="group w-full" />
          <h2 className="mt-6 font-heading text-2xl font-semibold">
            {t("emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-pretty text-muted-foreground">
            {t("emptyBody")}
          </p>
          <Button
            asChild
            size="lg"
            className="mt-7 h-12 rounded-full px-7 text-base shadow-xl shadow-primary/25 transition-all duration-300 ease-out hover:shadow-2xl active:scale-[0.97]"
          >
            <Link href="/create">
              <Plus aria-hidden />
              {t("createEvent")}
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5">
          {events.map((e, i) => (
            <li key={e.id}>
              <EventCard
                href={`/dashboard/events/${e.id}`}
                name={e.name}
                type={e.type}
                status={e.status}
                statusLabel={te(`status.${e.status}`)}
                meta={`${date(e.eventDate)}, ${te("photoCount", { count: e.mediaCount })}`}
                srcs={stacks[i]}
              />
            </li>
          ))}
          <li>
            <Link
              href="/create"
              className="group flex h-full items-center gap-4 rounded-[1.75rem] border-2 border-dashed border-primary/20 p-4 transition-all duration-300 ease-out hover:border-primary/40 hover:bg-card/60 active:scale-[0.99] sm:min-h-56 sm:flex-col sm:justify-center sm:gap-3 sm:p-6 sm:text-center"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform duration-300 ease-out group-hover:scale-110 group-active:scale-95 sm:size-14">
                <Plus className="size-6" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-heading text-lg font-semibold">
                  {t("newEventCard")}
                </span>
                <span className="block text-sm text-muted-foreground sm:mt-1">
                  {t("newEventCardBody")}
                </span>
              </span>
            </Link>
          </li>
        </ul>
      )}
    </PageBody>
  );
}
