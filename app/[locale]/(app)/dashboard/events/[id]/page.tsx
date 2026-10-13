import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarClock,
  ExternalLink,
  Images,
  Users,
} from "lucide-react";
import Image from "next/image";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { ActivatePlan } from "@/components/host/activate-plan";
import { CopyLinkButton } from "@/components/host/copy-link-button";
import { eventVisuals } from "@/components/host/event-visuals";
import { PhotoGrid } from "@/components/host/photo-grid";
import { SettingsForm } from "@/components/host/settings-form";
import { SharePanel } from "@/components/host/share-panel";
import { StatusPill } from "@/components/host/status-pill";
import { UserMenu } from "@/components/host/user-menu";
import { SiteHeader } from "@/components/site-header";
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
  const session = await getSession();
  if (!session) return redirect({ href: "/login", locale });

  const event = await getOwnedEvent(id, session.user.id);
  if (!event) return redirect({ href: "/dashboard", locale });

  const sp = await searchParams;
  const tab: Tab = TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : "overview";

  const [t, format, stats, rows] = await Promise.all([
    getTranslations("Events"),
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
  const { user } = session;
  const needsPlan = !event.plan;
  const link = guestUrl(event);
  const { cover, Icon } = eventVisuals[event.type];
  const date = (d: Date | string) =>
    format.dateTime(typeof d === "string" ? new Date(`${d}T12:00:00Z`) : d, {
      dateStyle: "medium",
      timeZone: "UTC",
    });
  const limits = event.plan ? plans[event.plan] : null;

  const stat = [
    {
      Icon: Images,
      label: t("stats.photos"),
      value: format.number(stats.photos),
      sub: limits ? `/ ${format.number(limits.maxItems)}` : null,
    },
    {
      Icon: Users,
      label: t("stats.guests"),
      value: format.number(stats.guests),
      sub: null,
    },
    {
      Icon: CalendarClock,
      label: t("stats.deletesOn"),
      value: date(event.expiresAt),
      sub: null,
    },
  ];

  return (
    <>
      <SiteHeader>
        <UserMenu name={user.name} email={user.email} image={user.image} />
      </SiteHeader>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-20">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
          {t("back")}
        </Link>

        {/* Cover header */}
        <header className="relative overflow-hidden rounded-[2rem] bg-foreground">
          <Image
            src={cover}
            alt=""
            fill
            priority
            sizes="(min-width: 1152px) 1120px, 100vw"
            className="object-cover object-[center_30%] opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15" />
          <div className="relative flex min-h-64 flex-col justify-end gap-5 p-6 text-white sm:p-8 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusPill
                  status={event.status}
                  label={t(`status.${event.status}`)}
                  onImage
                />
                <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-white/15 px-2.5 text-xs font-medium backdrop-blur">
                  <Icon className="size-3.5" aria-hidden />
                  {t(`types.${event.type}`)}
                </span>
                {event.plan && (
                  <span className="inline-flex h-6 items-center rounded-full bg-white/15 px-2.5 text-xs font-medium capitalize backdrop-blur">
                    {event.plan}
                  </span>
                )}
              </div>
              <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">
                {event.name}
              </h1>
              <p className="mt-1.5 text-white/80">{date(event.eventDate)}</p>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-2 md:flex [&>*]:min-w-0 [&>*]:px-3 sm:[&>*]:px-4">
              <CopyLinkButton
                link={link}
                variant="secondary"
                className="border-0 bg-white/15 text-white backdrop-blur hover:bg-white/25"
              />
              <Button
                asChild
                className="h-10 rounded-xl bg-white px-4 text-foreground hover:bg-white/90"
              >
                <a href={link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden />
                  {t("openGuest")}
                </a>
              </Button>
            </div>
          </div>
        </header>

        {needsPlan && (
          <div className="mt-6">
            <ActivatePlan
              eventId={event.id}
              devMode={!isProduction && !env.STRIPE_SECRET_KEY}
            />
          </div>
        )}

        <dl className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
          {stat.map(({ Icon: StatIcon, label, value, sub }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 sm:p-4"
            >
              <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:flex">
                <StatIcon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-medium text-muted-foreground">
                  {label}
                </dt>
                <dd className="font-heading text-base font-bold tabular-nums sm:text-xl">
                  {value}
                  {sub && (
                    <span className="ms-1 hidden text-sm font-medium text-muted-foreground sm:inline">
                      {sub}
                    </span>
                  )}
                </dd>
              </div>
            </div>
          ))}
        </dl>

        <nav
          aria-label={event.name}
          className="mt-8 inline-flex rounded-2xl bg-muted p-1"
        >
          {TABS.map((key) => (
            <Link
              key={key}
              href={`/dashboard/events/${event.id}?tab=${key}`}
              aria-current={tab === key ? "page" : undefined}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-all sm:px-5",
                tab === key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`tabs.${key}`)}
              {key === "overview" && stats.photos > 0 && (
                <span className="ms-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-foreground tabular-nums">
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
      </main>
    </>
  );
}
