import type { Metadata } from "next";
import { ChevronRight, ExternalLink, Settings } from "lucide-react";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { EventIcon } from "@/components/host/event-icon";
import { LiveShare } from "@/components/host/live-share";
import { BackLink, PageBody } from "@/components/host/page-header";
import {
  DownloadMenu,
  PhotoDownloads,
} from "@/components/host/photo-downloads";
import { PhotoGrid } from "@/components/host/photo-grid";
import { RefreshButton } from "@/components/host/refresh-button";
import { PrintTemplates } from "@/components/host/print-templates";
import { ResumeSetup } from "@/components/host/resume-setup";
import { SettingsForm } from "@/components/host/settings-form";
import { TicketSettings } from "@/components/host/ticket-settings";
import { SharePanel } from "@/components/host/share-panel";
import { StatusPill } from "@/components/host/status-pill";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { env, isProduction } from "@/lib/env";
import {
  getEventStats,
  getOwnedEvent,
  listEventMedia,
  mediaByUploader,
} from "@/lib/events/queries";
import {
  DEFAULT_TICKET,
  isTicketColor,
  isTicketPattern,
} from "@/lib/events/ticket";
import { guestUrl } from "@/lib/events/urls";
import { Link, redirect } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { plans } from "@/lib/plans";
import { publicEnv } from "@/lib/public-env";
import { presignGet } from "@/lib/storage";
import { extFor, isAllowedMime } from "@/lib/uploads";

export const metadata: Metadata = { robots: { index: false } };

type View = "main" | "photos" | "share" | "settings" | "print";

/** Newest photos on the event page; the rest under "See all". */
const PREVIEW_PHOTOS = 12;
/** Photos per step on the all-photos view ("Show more" adds this many). */
const PAGE_PHOTOS = 120;

export default async function EventPage({
  params,
  searchParams,
}: PageProps<"/[locale]/dashboard/events/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  // The layout already redirects signed-out visitors.
  const session = (await getSession())!;

  const event = await getOwnedEvent(id, session.user.id);
  if (!event) return redirect({ href: "/dashboard", locale });

  const sp = await searchParams;
  const raw = sp.view ?? sp.tab;
  const view: View =
    raw === "photos" || raw === "share" || raw === "settings" || raw === "print"
      ? raw
      : "main";
  const shown =
    view === "photos"
      ? Math.min(5000, Math.max(PAGE_PHOTOS, Number(sp.limit) || PAGE_PHOTOS))
      : PREVIEW_PHOTOS;
  const withPhotos = view === "main" || view === "photos";

  const [t, tg, format, stats, rows, guests] = await Promise.all([
    getTranslations("Events"),
    getTranslations("Guest"),
    getFormatter(),
    getEventStats(event.id),
    withPhotos ? listEventMedia(event.id, shown) : Promise.resolve([]),
    withPhotos ? mediaByUploader(event.id) : Promise.resolve([]),
  ]);
  const link = guestUrl(event);
  const eventPath = `/dashboard/events/${event.id}`;
  const published = event.status === "active";
  const devMode = !isProduction && !env.STRIPE_SECRET_KEY;
  const date = (d: Date | string) =>
    format.dateTime(typeof d === "string" ? new Date(`${d}T12:00:00Z`) : d, {
      dateStyle: "long",
      timeZone: "UTC",
    });

  const header = (
    <div className="flex items-start gap-4">
      <EventIcon type={event.type} className="size-14" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight text-balance">
            {event.name}
          </h1>
          <StatusPill
            status={event.status}
            label={t(`status.${event.status}`)}
          />
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <li>{date(event.eventDate)}</li>
          <li className="text-foreground">
            {t("photoCount", { count: stats.photos })}
          </li>
          <li className="text-foreground">
            {t("guestsCount", { count: stats.guests })}
          </li>
          <li>{t("deletesOnShort", { date: date(event.expiresAt) })}</li>
        </ul>
      </div>
    </div>
  );

  if (!withPhotos) {
    return (
      <PageBody>
        {view === "settings" && sp.from === "review" ? (
          <BackLink href={`/create?step=review&event=${event.id}`}>
            {t("backToReview")}
          </BackLink>
        ) : (
          <BackLink
            href={view === "print" ? `${eventPath}?view=share` : eventPath}
          >
            {view === "print" ? t("print.back") : t("backToEvent")}
          </BackLink>
        )}
        {header}
        <div className="mt-8">
          {view === "print" ? (
            published ? (
              <>
                <h2 className="font-heading text-xl font-semibold">
                  {t("print.title")}
                </h2>
                <p className="mt-1 mb-6 text-sm text-muted-foreground">
                  {t("print.subtitle")}
                </p>
                <PrintTemplates
                  eventId={event.id}
                  eventName={event.name}
                  date={date(event.eventDate)}
                  hasPin={Boolean(event.accessPinHash)}
                  pin={event.accessPin}
                  premium={event.plan === "premium"}
                  devMode={devMode}
                />
              </>
            ) : (
              <SharePanel
                eventId={event.id}
                eventName={event.name}
                link={link}
                hasPin={Boolean(event.accessPinHash)}
                published={false}
                premium={event.plan === "premium"}
              />
            )
          ) : view === "share" ? (
            <SharePanel
              eventId={event.id}
              eventName={event.name}
              link={link}
              hasPin={Boolean(event.accessPinHash)}
              published={published}
              premium={event.plan === "premium"}
            />
          ) : (
            <div className="space-y-6">
              <TicketSettings
                devPay={devMode}
                eventId={event.id}
                allowed={Boolean(event.plan && plans[event.plan].ticketStyles)}
                initial={{
                  color: isTicketColor(event.ticketColor)
                    ? event.ticketColor
                    : DEFAULT_TICKET.color,
                  pattern: isTicketPattern(event.ticketPattern)
                    ? event.ticketPattern
                    : DEFAULT_TICKET.pattern,
                }}
                preview={{
                  presenter: publicEnv.appName,
                  event: t(`types.${event.type}`),
                  name: event.name,
                  footer: date(event.eventDate),
                  stub: tg("ticketStub"),
                }}
              />
              <SettingsForm
                eventId={event.id}
                initial={{
                  name: event.name,
                  requireName: event.requireName,
                  eventDate: event.eventDate,
                  startsAt: (
                    event.startsAt ?? new Date(`${event.eventDate}T18:00:00Z`)
                  ).toISOString(),
                  endsAt: (
                    event.endsAt ?? new Date(`${event.eventDate}T23:00:00Z`)
                  ).toISOString(),
                  hasPin: Boolean(event.accessPinHash),
                  uploadOpensAt: event.uploadOpensAt?.toISOString() ?? null,
                  uploadClosesAt: event.uploadClosesAt?.toISOString() ?? null,
                  maxUploadsPerDevice: event.maxUploadsPerDevice,
                }}
              />
            </div>
          )}
        </div>
      </PageBody>
    );
  }

  const photos = await Promise.all(
    rows.map(async (m) => ({
      id: m.id,
      src: await presignGet(m.thumbKey ?? m.r2Key),
      full: await presignGet(m.r2Key),
      download: await presignGet(m.r2Key, {
        filename: `${event.slug}-${m.id.slice(0, 8)}.${isAllowedMime(m.mime) ? extFor(m.mime) : "jpg"}`,
      }),
      bytes: m.bytes,
      uploaderName: m.uploaderName,
      width: m.width,
      height: m.height,
      canBlock: Boolean(m.deviceId),
      createdAt: m.createdAt.toISOString(),
    })),
  );

  const photosSection = (
    <PhotoDownloads
      eventId={event.id}
      eventName={event.name}
      guests={guests}
      totalPhotos={guests.reduce((n, g) => n + g.photos, 0)}
      totalBytes={guests.reduce((n, g) => n + g.bytes, 0)}
      visible={photos.map((p) => ({ id: p.id, bytes: p.bytes }))}
    >
      <section className={view === "photos" ? "mt-8" : "mt-10"}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading text-xl font-semibold">
              {t("photosTitle")}
              {stats.photos > 0 && (
                <span className="ms-2 text-base font-normal text-muted-foreground tabular-nums">
                  {stats.photos}
                </span>
              )}
            </h2>
            <RefreshButton />
          </div>
          <div className="flex items-center gap-1">
            <Button
              asChild
              variant="ghost"
              className="h-9 rounded-full px-3 text-muted-foreground"
            >
              <a href={link} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden />
                {t("openGuest")}
              </a>
            </Button>
            <DownloadMenu />
          </div>
        </div>
        <PhotoGrid eventId={event.id} photos={photos} published={published} />
        {view === "main" && stats.photos > photos.length && (
          <Link
            href={`${eventPath}?view=photos`}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-semibold shadow-xs transition-colors hover:border-primary/30 hover:bg-accent/40"
          >
            {t("photos.seeAll", { count: stats.photos })}
          </Link>
        )}
        {view === "photos" && stats.photos > photos.length && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {t("photos.showing", {
                shown: photos.length,
                total: stats.photos,
              })}
            </p>
            <Link
              href={`${eventPath}?view=photos&limit=${shown + PAGE_PHOTOS}`}
              scroll={false}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold shadow-xs transition-colors hover:bg-accent/40"
            >
              {t("photos.showMore")}
            </Link>
          </div>
        )}
      </section>
    </PhotoDownloads>
  );

  if (view === "photos") {
    return (
      <PageBody>
        <BackLink href={eventPath}>{t("backToEvent")}</BackLink>
        {header}
        {photosSection}
      </PageBody>
    );
  }

  return (
    <PageBody>
      <BackLink href="/dashboard">{t("back")}</BackLink>
      {header}

      <div className="mt-8">
        {published ? (
          <LiveShare eventId={event.id} link={link} />
        ) : (
          <ResumeSetup eventId={event.id} plan={event.plan} />
        )}
      </div>

      {photosSection}

      <Link
        href={`${eventPath}?view=settings`}
        className="group mt-10 flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 sm:p-5"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Settings className="size-5 text-muted-foreground" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t("tabs.settings")}</span>
          <span className="block truncate text-sm text-muted-foreground">
            {[
              t("settings.pinToggle"),
              t("settings.hoursToggle"),
              t("settings.perPhoneToggle"),
            ].join(", ")}
          </span>
        </span>
        <ChevronRight
          className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
          aria-hidden
        />
      </Link>
    </PageBody>
  );
}
