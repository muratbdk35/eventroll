import type { Metadata } from "next";
import {
  Archive,
  ExternalLink,
  HardDrive,
  Settings,
  Sparkles,
} from "lucide-react";
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
import { FlaggedBanner } from "@/components/host/flagged-banner";
import { PhotoGrid } from "@/components/host/photo-grid";
import { RefreshButton } from "@/components/host/refresh-button";
import { PrintTemplates } from "@/components/host/print-templates";
import { RefundCard } from "@/components/host/refund-card";
import {
  UpgradePanel,
  type UpgradeOption,
} from "@/components/host/upgrade-panel";
import { ResumeSetup } from "@/components/host/resume-setup";
import { SettingsForm } from "@/components/host/settings-form";
import { TicketSettings } from "@/components/host/ticket-settings";
import { SharePanel } from "@/components/host/share-panel";
import { StatusPill } from "@/components/host/status-pill";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { env, isProduction } from "@/lib/env";
import {
  countFlagged,
  getEventStats,
  getOwnedEvent,
  listEventMedia,
  mediaByUploader,
} from "@/lib/events/queries";
import { pastWindow } from "@/lib/events/notices";
import { CURRENCY, nextPlan, planOrder, plans } from "@/lib/plans";
import { fulfilSessionId, selfRefundable } from "@/lib/payments";
import { amountFor } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { ticketColor } from "@/lib/events/ticket";
import { guestUrl } from "@/lib/events/urls";
import { Link, redirect } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { publicEnv } from "@/lib/public-env";
import { presignGet } from "@/lib/storage";
import { extFor, isAllowedMime } from "@/lib/uploads";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/events/[id]">): Promise<Metadata> {
  const { id } = await params;
  const session = await getSession();
  const event = session ? await getOwnedEvent(id, session.user.id) : null;
  return { title: event?.name, robots: { index: false } };
}

type View = "main" | "photos" | "share" | "settings" | "print" | "upgrade";

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

  // Back from Stripe after an upgrade: confirm with Stripe before reading.
  const spEarly = await searchParams;
  const paidSession = Array.isArray(spEarly.session_id)
    ? spEarly.session_id[0]
    : spEarly.session_id;
  if (paidSession) {
    await fulfilSessionId(paidSession, session.user.id).catch((e) =>
      console.error("[checkout] return verification failed", e),
    );
    // Reload without the session id: the page metadata may already have
    // read the event before the plan changed.
    return redirect({
      href: `/dashboard/events/${id}?upgraded=1`,
      locale,
    });
  }

  const event = await getOwnedEvent(id, session.user.id);
  if (!event) return redirect({ href: "/dashboard", locale });

  const sp = await searchParams;
  const raw = sp.view ?? sp.tab;
  const view: View =
    raw === "photos" ||
    raw === "share" ||
    raw === "settings" ||
    raw === "print" ||
    raw === "upgrade"
      ? raw
      : "main";
  const shown =
    view === "photos"
      ? Math.min(5000, Math.max(PAGE_PHOTOS, Number(sp.limit) || PAGE_PHOTOS))
      : PREVIEW_PHOTOS;
  const withPhotos = view === "main" || view === "photos";

  const [t, tg, tp, format, stats, rows, guests, flagged] = await Promise.all([
    getTranslations("Events"),
    getTranslations("Guest"),
    getTranslations("Landing.pricing"),
    getFormatter(),
    getEventStats(event.id),
    withPhotos
      ? listEventMedia(event.id, shown, { hideFlagged: event.hideFlagged })
      : Promise.resolve([]),
    withPhotos
      ? mediaByUploader(event.id, { hideFlagged: event.hideFlagged })
      : Promise.resolve([]),
    withPhotos ? countFlagged(event.id) : Promise.resolve(0),
  ]);
  const link = guestUrl(event);
  const eventPath = `/dashboard/events/${event.id}`;
  const published = event.status === "active";
  // Past the download window (#54): purged by the daily job, or about to be.
  const expired = event.status === "expired" || pastWindow(event.expiresAt);
  const purged = Boolean(event.purgedAt);
  // How full the album is: the tighter of photo count and storage.
  const limits = event.plan ? plans[event.plan] : null;
  const templates = Boolean(limits?.printTemplates);
  const upgrade = event.plan ? nextPlan(event.plan) : null;
  const usage = limits
    ? Math.max(
        event.mediaCount / limits.maxItems,
        event.storageBytes / limits.maxBytes,
      )
    : 0;
  const devMode = !isProduction && !env.STRIPE_SECRET_KEY;
  const date = (d: Date | string) =>
    format.dateTime(typeof d === "string" ? new Date(`${d}T12:00:00Z`) : d, {
      dateStyle: "long",
      timeZone: "UTC",
    });

  const header = (
    <div className="flex items-start gap-3 sm:gap-4">
      <EventIcon type={event.type} className="size-12 sm:size-14" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="font-heading text-2xl leading-tight font-bold tracking-tight text-balance [overflow-wrap:anywhere] sm:text-3xl">
            {event.name}
          </h1>
          <StatusPill
            status={event.status}
            label={t(`status.${event.status}`)}
          />
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <li>{date(event.eventDate)}</li>
          {/* Counts stay together when the line wraps on a phone. */}
          <li className="text-foreground">
            {t("photoCount", { count: stats.photos })}
            <span aria-hidden className="mx-1.5 text-muted-foreground">
              ·
            </span>
            {t("guestsCount", { count: stats.guests })}
          </li>
          <li>
            {event.purgedAt
              ? t("deletedOnShort", { date: date(event.purgedAt) })
              : t("deletesOnShort", { date: date(event.expiresAt) })}
          </li>
        </ul>
      </div>
      {/* Settings up here, not under a long gallery. */}
      {view === "main" && !expired && (
        <Link
          href={`${eventPath}?view=settings`}
          aria-label={t("tabs.settings")}
          className="inline-flex size-10 shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-semibold shadow-xs transition-colors hover:border-primary/30 hover:bg-accent/40 sm:w-auto sm:px-3.5"
        >
          <Settings className="size-4 text-muted-foreground" aria-hidden />
          {/* On phones the round icon alone leaves the name room. */}
          <span className="hidden sm:inline">{t("tabs.settings")}</span>
        </Link>
      )}
    </div>
  );

  const upgradeOptions: UpgradeOption[] =
    view === "upgrade"
      ? planOrder.flatMap((id) => {
          const cents = amountFor(event.plan, id);
          if (cents === null) return [];
          const p = plans[id];
          return [
            {
              id,
              name: tp(`plans.${id}.name`),
              price: format.number(cents / 100, {
                style: "currency",
                currency: CURRENCY,
                maximumFractionDigits: 0,
              }),
              details: t("upgrade.details", {
                photos: format.number(p.maxItems),
                gb: p.maxBytes / 1024 ** 3,
                days: p.retentionDays,
              }),
              templates: p.printTemplates && !limits?.printTemplates,
            },
          ];
        })
      : [];
  const refundable =
    view === "settings" && !devMode && (await selfRefundable(event.id));

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
          {view === "upgrade" ? (
            upgradeOptions.length > 0 ? (
              <>
                <h2 className="font-heading text-xl font-semibold">
                  {t("upgrade.title")}
                </h2>
                <p className="mt-1 mb-6 text-sm text-pretty text-muted-foreground">
                  {event.plan
                    ? t("upgrade.subtitle", {
                        plan: tp(`plans.${event.plan}.name`),
                      })
                    : t("upgrade.subtitleNone")}
                </p>
                <UpgradePanel
                  eventId={event.id}
                  options={upgradeOptions}
                  devMode={devMode}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("upgrade.top")}
              </p>
            )
          ) : view === "print" ? (
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
                  initialColor={ticketColor(event.ticketColor)}
                  hasPin={Boolean(event.accessPinHash)}
                  pin={event.accessPin}
                  included={templates}
                />
              </>
            ) : (
              <SharePanel
                eventId={event.id}
                eventName={event.name}
                link={link}
                hasPin={Boolean(event.accessPinHash)}
                published={false}
                templates={templates}
              />
            )
          ) : view === "share" ? (
            <SharePanel
              eventId={event.id}
              eventName={event.name}
              link={link}
              hasPin={Boolean(event.accessPinHash)}
              published={published}
              templates={templates}
            />
          ) : (
            <div className="space-y-6">
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
              >
                <TicketSettings
                  eventId={event.id}
                  initial={ticketColor(event.ticketColor)}
                  preview={{
                    presenter: publicEnv.appName,
                    event: t(`types.${event.type}`),
                    name: event.name,
                    footer: date(event.eventDate),
                    stub: tg("ticketStub"),
                    watermark: event.eventDate.slice(0, 4),
                  }}
                />
              </SettingsForm>
              {refundable && <RefundCard eventId={event.id} />}
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
      flagged: m.moderation === "flagged",
      createdAt: m.createdAt.toISOString(),
    })),
  );

  // Hidden photos waiting for review don't count in the grid (#56).
  const listed = stats.photos - (event.hideFlagged ? flagged : 0);

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
              {listed > 0 && (
                <span className="ms-2 text-base font-normal text-muted-foreground tabular-nums">
                  {listed}
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
        {flagged > 0 && (
          <FlaggedBanner
            eventId={event.id}
            count={flagged}
            hidden={event.hideFlagged}
          />
        )}
        <PhotoGrid eventId={event.id} photos={photos} published={published} />
        {view === "main" && listed > photos.length && (
          <Link
            href={`${eventPath}?view=photos`}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-semibold shadow-xs transition-colors hover:border-primary/30 hover:bg-accent/40"
          >
            {t("photos.seeAll", { count: listed })}
          </Link>
        )}
        {view === "photos" && listed > photos.length && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {t("photos.showing", {
                shown: photos.length,
                total: listed,
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

      {sp.upgraded && event.plan && (
        <p
          role="status"
          className="mt-6 flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 p-3.5 text-sm font-semibold"
        >
          <Sparkles className="size-4 text-success" aria-hidden />
          {t("upgrade.done")} {tp(`plans.${event.plan}.name`)}
        </p>
      )}

      <div className="mt-8">
        {expired ? (
          <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <Archive className="size-5 text-muted-foreground" aria-hidden />
            </span>
            <div>
              <h2 className="font-heading text-lg font-semibold">
                {t("expiredNotice.title")}
              </h2>
              <p className="mt-1 text-sm text-pretty text-muted-foreground">
                {purged
                  ? t("expiredNotice.purged", {
                      date: date(event.purgedAt ?? event.expiresAt),
                    })
                  : t("expiredNotice.pending")}
              </p>
            </div>
          </div>
        ) : published ? (
          <LiveShare eventId={event.id} link={link} />
        ) : (
          <ResumeSetup eventId={event.id} plan={event.plan} />
        )}
      </div>

      {published && !expired && usage >= 0.9 && limits && (
        <div
          role="status"
          className={cn(
            "mt-4 flex items-start gap-3 rounded-2xl border p-4",
            usage >= 1
              ? "border-destructive/25 bg-destructive/5"
              : "border-amber-500/25 bg-amber-500/8",
          )}
        >
          <HardDrive
            className={cn(
              "mt-0.5 size-4 shrink-0",
              usage >= 1 ? "text-destructive" : "text-amber-700",
            )}
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold">
              {usage >= 1
                ? t("capacity.full")
                : t("capacity.almost", { pct: Math.floor(usage * 100) })}
            </p>
            <p className="mt-0.5 text-[13px] text-pretty text-muted-foreground">
              {t("capacity.detail", {
                count: event.mediaCount,
                max: limits.maxItems,
              })}
              {upgrade &&
                ` ${t("capacity.next", {
                  plan: tp(`plans.${upgrade}.name`),
                  photos: format.number(plans[upgrade].maxItems),
                  gb: plans[upgrade].maxBytes / 1024 ** 3,
                })}`}
            </p>
            {upgrade && (
              <Link
                href={`${eventPath}?view=upgrade`}
                className="mt-2 inline-flex text-[13px] font-semibold text-primary underline-offset-2 hover:underline"
              >
                {t("upgrade.link")}
              </Link>
            )}
          </div>
        </div>
      )}

      {!purged && photosSection}
    </PageBody>
  );
}
