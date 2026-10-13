import type { Metadata } from "next";
import { CalendarPlus, ChevronRight, Plus } from "lucide-react";
import Image from "next/image";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { eventVisuals } from "@/components/host/event-visuals";
import { PageBody, PageHeader } from "@/components/host/page-header";
import { StatusPill } from "@/components/host/status-pill";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { listOwnedEvents } from "@/lib/events/queries";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard");
  return { title: t("listTitle"), robots: { index: false } };
}

export default async function DashboardPage({
  params,
}: PageProps<"/[locale]/dashboard">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  // The layout already redirects signed-out visitors.
  const session = (await getSession())!;

  const [t, te, tApp, format, events] = await Promise.all([
    getTranslations("Dashboard"),
    getTranslations("Events"),
    getTranslations("App"),
    getFormatter(),
    listOwnedEvents(session.user.id),
  ]);
  const date = (d: string) =>
    format.dateTime(new Date(`${d}T12:00:00Z`), {
      dateStyle: "medium",
      timeZone: "UTC",
    });

  return (
    <>
      <PageHeader
        crumbs={[{ label: t("listTitle") }]}
        actions={
          <Button asChild variant="dark" size="sm" className="h-8 px-3">
            <Link href="/dashboard/new">
              <Plus aria-hidden />
              {tApp("newEvent")}
            </Link>
          </Button>
        }
      />
      <PageBody>
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold tracking-tight">
            {t("listTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("listSubtitle")}
          </p>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-background px-6 py-16 text-center">
            <span className="flex size-11 items-center justify-center rounded-lg border border-border bg-muted/50">
              <CalendarPlus
                className="size-5 text-muted-foreground"
                aria-hidden
              />
            </span>
            <h2 className="mt-4 text-[15px] font-semibold">
              {t("emptyTitle")}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-pretty text-muted-foreground">
              {t("emptyBody")}
            </p>
            <Button asChild variant="dark" className="mt-5 h-9 px-4">
              <Link href="/dashboard/new">
                <Plus aria-hidden />
                {t("createEvent")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-background shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
            <div className="hidden grid-cols-[1fr_9rem_7rem_1.5rem] gap-4 border-b border-border bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground sm:grid">
              <span>{t("colEvent")}</span>
              <span>{t("colStatus")}</span>
              <span className="text-end">{t("colPhotos")}</span>
              <span />
            </div>
            <ul className="divide-y divide-border">
              {events.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/dashboard/events/${e.id}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none sm:grid-cols-[1fr_9rem_7rem_1.5rem]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-black/5">
                        <Image
                          src={eventVisuals[e.type].cover}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {e.name}
                        </span>
                        <span className="block truncate text-[13px] text-muted-foreground">
                          {te("meta", {
                            type: te(`types.${e.type}`),
                            date: date(e.eventDate),
                          })}
                        </span>
                      </span>
                    </span>
                    <span className="justify-self-end sm:justify-self-start">
                      <StatusPill
                        status={e.status}
                        label={te(`status.${e.status}`)}
                      />
                    </span>
                    <span className="hidden text-end text-sm text-muted-foreground tabular-nums sm:block">
                      {format.number(e.mediaCount)}
                    </span>
                    <ChevronRight
                      className="hidden size-4 text-muted-foreground/60 sm:block rtl:rotate-180"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </PageBody>
    </>
  );
}
