import type { Metadata } from "next";
import {
  Archive,
  Ban,
  Clock,
  Hourglass,
  Lock,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LogoMark } from "@/components/brand/logo";
import { eventVisuals } from "@/components/host/event-visuals";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getEventBySlug } from "@/lib/events/queries";
import { getUploadState } from "@/lib/events/upload-state";
import { getGuestSession } from "@/lib/guest/session";
import type { Locale } from "@/lib/i18n/routing";
import { publicEnv } from "@/lib/public-env";
import { presignGet } from "@/lib/storage";
import { Uploader } from "./uploader";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const stateIcon = {
  needs_plan: Hourglass,
  not_open_yet: Clock,
  closed: Lock,
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

  const t = await getTranslations("Guest");
  const guest = await getGuestSession(event.id);
  const blocked = Boolean(
    guest && event.blockedDeviceIds.includes(guest.deviceId),
  );
  const state = blocked ? "blocked" : getUploadState(event);
  // Host-uploaded cover if set, otherwise the stock photo for the event type.
  const cover = event.coverKey
    ? { src: await presignGet(event.coverKey), custom: true }
    : { src: eventVisuals[event.type].cover, custom: false };

  return (
    <div className="relative flex flex-1 flex-col bg-[oklch(0.975_0.012_244)] md:items-center md:justify-center md:px-6 md:py-12">
      <div className="relative flex w-full flex-1 flex-col md:max-w-[440px] md:flex-none md:overflow-hidden md:rounded-[2rem] md:bg-white/40 md:shadow-2xl md:ring-1 md:shadow-primary/10 md:ring-black/5">
        <header className="relative h-56 shrink-0 overflow-hidden bg-foreground">
          {cover.custom ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
            <img
              src={cover.src}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <Image
              src={cover.src}
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 440px, 100vw"
              className="object-cover object-[center_30%]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/0 to-black/70" />
          <div className="relative flex h-full flex-col px-5 pt-4 pb-12">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md">
                <LogoMark className="size-6" />
              </span>
              <LocaleSwitcher variant="glass" />
            </div>
            <div className="mt-auto text-white">
              <p className="text-[11px] font-medium tracking-[0.18em] uppercase opacity-85">
                {t("for")}
              </p>
              <h1 className="mt-1 font-heading text-[1.75rem] leading-tight font-bold tracking-tight text-balance drop-shadow-sm">
                {event.name}
              </h1>
            </div>
          </div>
        </header>

        {/* Plain sheet sliding over the cover. */}
        <main className="relative -mt-7 flex-1 rounded-t-[1.75rem] bg-[oklch(0.975_0.012_244)] px-5 pt-6 pb-8">
          {state === "open" ? (
            <>
              <Uploader
                slug={event.slug}
                requireName={event.requireName}
                hasPin={Boolean(event.accessPinHash)}
                maxPerDevice={event.maxUploadsPerDevice}
                verified={guest?.verified ?? false}
                turnstileSiteKey={publicEnv.turnstileSiteKey}
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
