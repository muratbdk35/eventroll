import type { Metadata } from "next";
import { Plus } from "lucide-react";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { EventIcon } from "@/components/host/event-icon";
import { PageBody } from "@/components/host/page-header";
import { PhotoStack } from "@/components/host/photo-stack";
import { StatusPill } from "@/components/host/status-pill";
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
  const stacks = await Promise.all(
    events.map(async (e) =>
      Promise.all((await latestPhotoKeys(e.id)).map((k) => presignGet(k))),
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
        <div className="mt-10 flex flex-col items-center rounded-[2rem] border border-white/70 bg-card/80 p-10 text-center shadow-xl ring-1 shadow-primary/5 ring-black/5 backdrop-blur-xl">
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
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {events.map((e, i) => (
            <li key={e.id}>
              <Link
                href={`/dashboard/events/${e.id}`}
                className="group flex h-full flex-col rounded-[1.75rem] border border-white/70 bg-card/85 p-3 shadow-sm ring-1 ring-black/5 backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.99]"
              >
                <div className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-accent/70 via-accent/30 to-transparent pt-4">
                  <PhotoStack srcs={stacks[i]} type={e.type} />
                  <StatusPill
                    status={e.status}
                    label={te(`status.${e.status}`)}
                    className="absolute end-3 top-3 bg-card/90 shadow-sm backdrop-blur"
                  />
                </div>
                <div className="flex items-center gap-3 px-2 pt-4 pb-1.5">
                  <EventIcon type={e.type} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-lg leading-tight font-semibold">
                      {e.name}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {date(e.eventDate)} ·{" "}
                      {te("photoCount", { count: e.mediaCount })}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/create"
              className="group flex h-full min-h-56 flex-col items-center justify-center gap-3 rounded-[1.75rem] border-2 border-dashed border-primary/20 p-6 text-center transition-all duration-300 ease-out hover:border-primary/40 hover:bg-card/60 active:scale-[0.99]"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/25 transition-transform duration-300 ease-out group-hover:scale-110 group-active:scale-95">
                <Plus className="size-6" aria-hidden />
              </span>
              <span className="font-heading text-lg font-semibold">
                {t("newEventCard")}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("newEventCardBody")}
              </span>
            </Link>
          </li>
        </ul>
      )}
    </PageBody>
  );
}
