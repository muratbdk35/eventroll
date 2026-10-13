import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { ActivatePlan } from "@/components/host/activate-plan";
import { CopyLinkButton } from "@/components/host/copy-link-button";
import { eventVisuals } from "@/components/host/event-visuals";
import { PageBody, PageHeader } from "@/components/host/page-header";
import { PhotoGrid } from "@/components/host/photo-grid";
import { SettingsForm } from "@/components/host/settings-form";
import { SharePanel } from "@/components/host/share-panel";
import { StatusPill } from "@/components/host/status-pill";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { env, isProduction } from "@/lib/env";
import {
  getEventStats,
  getOwnedEvent,
  listEventMedia,
} from "@/lib/events/queries";
import { guestUrl } from "@/lib/events/urls";
import { Link, redirect } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { plans } from "@/lib/plans";
import { presignGet } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { robots: { index: false } };

const TABS = ["overview", "share", "settings"] as const;
type Tab = (typeof TABS)[number];

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
  const tab: Tab = TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : "overview";

  const [t, tDash, format, stats, rows] = await Promise.all([
    getTranslations("Events"),
    getTranslations("Dashboard"),
    getFormatter(),
    getEventStats(event.id),
    tab === "overview" ? listEventMedia(event.id) : Promise.resolve([]),
  ]);
  const photos = await Promise.all(
    rows.map(async (m) => ({
      id: m.id,
      src: await presignGet(m.thumbKey ?? m.r2Key),
      full: await presignGet(m.r2Key),
      uploaderName: m.uploaderName,
      canBlock: Boolean(m.deviceId),
      createdAt: m.createdAt.toISOString(),
    })),
  );
  const needsPlan = !event.plan;
  const link = guestUrl(event);
  const { cover } = eventVisuals[event.type];
  const date = (d: Date | string) =>
    format.dateTime(typeof d === "string" ? new Date(`${d}T12:00:00Z`) : d, {
      dateStyle: "medium",
      timeZone: "UTC",
    });
  const limits = event.plan ? plans[event.plan] : null;

  const cells = [
    {
      label: t("stats.photos"),
      value: format.number(stats.photos),
      sub: limits ? `/ ${format.number(limits.maxItems)}` : null,
    },
    { label: t("stats.guests"), value: format.number(stats.guests), sub: null },
    { label: t("stats.deletesOn"), value: date(event.expiresAt), sub: null },
  ];

  return (
    <>
      <PageHeader
        crumbs={[
          { label: tDash("listTitle"), href: "/dashboard" },
          { label: event.name },
        ]}
      />
      <PageBody>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-black/5">
              <Image
                src={cover}
                alt=""
                fill
                sizes="56px"
                priority
                className="object-cover"
              />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[22px] font-semibold tracking-tight">
                {event.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted-foreground">
                <StatusPill
                  status={event.status}
                  label={t(`status.${event.status}`)}
                />
                <span>
                  {t("meta", {
                    type: t(`types.${event.type}`),
                    date: date(event.eventDate),
                  })}
                </span>
                {event.plan && (
                  <span className="capitalize">· {event.plan}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <CopyLinkButton
              link={link}
              className="h-8 flex-1 px-3 sm:flex-none"
            />
            <Button
              asChild
              variant="outline"
              className="h-8 flex-1 px-3 sm:flex-none"
            >
              <a href={link} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden />
                {t("openGuest")}
              </a>
            </Button>
          </div>
        </div>

        {needsPlan && (
          <div className="mt-6">
            <ActivatePlan
              eventId={event.id}
              devMode={!isProduction && !env.STRIPE_SECRET_KEY}
            />
          </div>
        )}

        <dl className="mt-6 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-xl border border-border bg-background shadow-[0_1px_2px_rgb(0_0_0/0.03)] rtl:divide-x-reverse">
          {cells.map(({ label, value, sub }) => (
            <div key={label} className="min-w-0 px-4 py-3.5 sm:px-5 sm:py-4">
              <dt className="truncate text-xs text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 text-[15px] leading-snug font-semibold tracking-tight tabular-nums sm:truncate sm:text-xl">
                {value}
                {sub && (
                  <span className="ms-1 hidden text-sm font-normal text-muted-foreground sm:inline">
                    {sub}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <nav
          aria-label={event.name}
          className="mt-8 flex gap-6 border-b border-border"
        >
          {TABS.map((key) => (
            <Link
              key={key}
              href={`/dashboard/events/${event.id}?tab=${key}`}
              aria-current={tab === key ? "page" : undefined}
              className={cn(
                "-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-sm font-medium transition-colors",
                tab === key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`tabs.${key}`)}
              {key === "overview" && stats.photos > 0 && (
                <span className="rounded-md bg-muted px-1.5 py-px text-[11px] text-muted-foreground tabular-nums">
                  {stats.photos}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="mt-6">
          {tab === "overview" && (
            <PhotoGrid eventId={event.id} photos={photos} />
          )}
          {tab === "share" && (
            <SharePanel
              eventId={event.id}
              eventName={event.name}
              link={link}
              hasPin={Boolean(event.accessPinHash)}
              hasPlan={!needsPlan}
              premium={event.plan === "premium"}
            />
          )}
          {tab === "settings" && (
            <SettingsForm
              eventId={event.id}
              initial={{
                name: event.name,
                requireName: event.requireName,
                hasPin: Boolean(event.accessPinHash),
                uploadOpensAt: event.uploadOpensAt?.toISOString() ?? null,
                uploadClosesAt: event.uploadClosesAt?.toISOString() ?? null,
                maxUploadsPerDevice: event.maxUploadsPerDevice,
              }}
            />
          )}
        </div>
      </PageBody>
    </>
  );
}
