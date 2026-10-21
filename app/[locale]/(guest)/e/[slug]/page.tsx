import type { Metadata } from "next";
import {
  Archive,
  CirclePause,
  Ban,
  Clock,
  Hourglass,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { notFound } from "next/navigation";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { LogoMark } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { EventTicket } from "@/components/ui/event-ticket";
import { getEventBySlug } from "@/lib/events/queries";
import { getUploadState } from "@/lib/events/upload-state";
import { getGuestSession } from "@/lib/guest/session";
import type { Locale } from "@/lib/i18n/routing";
import {
  ticketColor,
  ticketConfetti,
  ticketThemeStyle,
} from "@/lib/events/ticket";
import { publicEnv } from "@/lib/public-env";
import { Uploader } from "./uploader";

/**
 * The title guests see in the tab and in the link preview when the host
 * shares the link (WhatsApp, iMessage): the event's name and what to do.
 */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/e/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [event, t] = await Promise.all([
    getEventBySlug(slug),
    getTranslations("Guest"),
  ]);
  const base: Metadata = {
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
  if (!event || event.status === "deleted") return base;
  const title = t("metaTitle", { name: event.name });
  const description = t("metaDescription");
  return {
    ...base,
    title: { absolute: title },
    description,
    openGraph: { title, description, type: "website" },
  };
}

const stateIcon = {
  needs_plan: Hourglass,
  not_open_yet: Clock,
  closed: Lock,
  paused: CirclePause,
  expired: Archive,
  unavailable: Ban,
  blocked: Ban,
} as const;

export default async function GuestPage({
  params,
}: PageProps<"/[locale]/e/[slug]">) {
  const { locale: rawLocale, slug } = await params;
  setRequestLocale(rawLocale as Locale);

  const event = await getEventBySlug(slug);
  if (!event || event.status === "deleted") notFound();

  const [t, te, format] = await Promise.all([
    getTranslations("Guest"),
    getTranslations("Events"),
    getFormatter(),
  ]);
  const guest = await getGuestSession(event.id);
  const blocked = Boolean(
    guest && event.blockedDeviceIds.includes(guest.deviceId),
  );
  const state = blocked ? "blocked" : getUploadState(event);
  const color = ticketColor(event.ticketColor);

  return (
    // The whole page takes the ticket's colour as its theme (#48).
    <div
      className="relative flex flex-1 flex-col md:items-center md:justify-center md:px-6 md:py-12"
      style={ticketThemeStyle(color)}
    >
      <div className="relative flex w-full flex-1 flex-col md:max-w-[440px] md:flex-none md:overflow-hidden md:rounded-[2rem] md:bg-white/40 md:shadow-2xl md:ring-1 md:shadow-primary/10 md:ring-black/5">
        {/* The page opens with the event ticket on a plain ground (#41, #42). */}
        <header className="px-5 pt-4">
          <div className="flex items-center justify-between">
            <span className="flex size-10 items-center justify-center rounded-full bg-card text-foreground shadow-sm ring-1 ring-black/5">
              <LogoMark className="size-6" />
            </span>
            <LocaleSwitcher />
          </div>
          <h1 className="sr-only">{event.name}</h1>
          <EventTicket
            className="mt-6"
            presenter={publicEnv.appName}
            event={te(`types.${event.type}`)}
            name={event.name}
            footer={format.dateTime(new Date(`${event.eventDate}T12:00:00Z`), {
              dateStyle: "long",
              timeZone: "UTC",
            })}
            stub={t("ticketStub")}
            watermark={event.eventDate.slice(0, 4)}
            color={color}
          />
        </header>

        {/* No background of its own: header and main share one ground, so
            the ticket's shadow isn't cut off in a straight line. */}
        <main className="relative flex-1 px-5 pt-7 pb-8">
          {state === "open" ? (
            <>
              <Uploader
                slug={event.slug}
                requireName={event.requireName}
                hasPin={Boolean(event.accessPinHash)}
                maxPerDevice={event.maxUploadsPerDevice}
                verified={guest?.verified ?? false}
                turnstileSiteKey={publicEnv.turnstileSiteKey}
                confettiColors={ticketConfetti(color)}
              />
              <p className="mx-auto mt-8 flex max-w-xs items-start justify-center gap-2 text-center text-xs text-pretty text-muted-foreground">
                <ShieldCheck
                  className="mt-px size-4 shrink-0 text-success"
                  aria-hidden
                />
                {t("privacy")}
              </p>
            </>
          ) : (
            <StateMessage
              Icon={stateIcon[state]}
              title={t(`state.${state}.title`)}
              body={t(`state.${state}.body`)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function StateMessage({
  Icon,
  title,
  body,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-white shadow-lg ring-1 shadow-primary/10 ring-black/5">
        <Icon className="size-6 text-primary" aria-hidden />
      </span>
      <h2 className="mt-5 font-heading text-xl font-semibold text-balance">
        {title}
      </h2>
      <p className="mt-1 max-w-xs text-sm text-pretty text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
