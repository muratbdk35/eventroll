import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { ActivatePlan } from "@/components/host/activate-plan";
import { PhotoGrid } from "@/components/host/photo-grid";
import { SettingsForm } from "@/components/host/settings-form";
import { SharePanel } from "@/components/host/share-panel";
import { UserMenu } from "@/components/host/user-menu";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
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
      uploaderName: m.uploaderName,
      canBlock: Boolean(m.deviceId),
    })),
  );
  const { user } = session;
  const needsPlan = !event.plan;
  const date = (d: Date | string) =>
    format.dateTime(typeof d === "string" ? new Date(`${d}T12:00:00Z`) : d, {
      dateStyle: "medium",
      timeZone: "UTC",
    });

  return (
    <>
      <SiteHeader>
        <UserMenu name={user.name} email={user.email} image={user.image} />
      </SiteHeader>
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8">
        <div>
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
            {t("back")}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-bold text-balance">
              {event.name}
            </h1>
            <Badge
              variant={event.status === "active" ? "default" : "secondary"}
            >
              {t(`status.${event.status}`)}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(`types.${event.type}`)} · {date(event.eventDate)}
          </p>
        </div>

        {needsPlan && (
          <ActivatePlan
            eventId={event.id}
            devMode={!isProduction && !env.STRIPE_SECRET_KEY}
          />
        )}

        <dl className="grid grid-cols-3 gap-3">
          {[
            [t("stats.photos"), stats.photos],
            [t("stats.guests"), stats.guests],
            [t("stats.deletesOn"), date(event.expiresAt)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-heading text-xl font-bold sm:text-2xl">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <nav aria-label="Event" className="flex gap-1 border-b border-border">
          {TABS.map((key) => (
            <Link
              key={key}
              href={`/dashboard/events/${event.id}?tab=${key}`}
              aria-current={tab === key ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                tab === key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`tabs.${key}`)}
            </Link>
          ))}
        </nav>

        {tab === "overview" && <PhotoGrid eventId={event.id} photos={photos} />}
        {tab === "share" && (
          <SharePanel
            eventId={event.id}
            link={guestUrl(event)}
            hasPin={Boolean(event.accessPinHash)}
            hasPlan={!needsPlan}
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
      </main>
    </>
  );
}
