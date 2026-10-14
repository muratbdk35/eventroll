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
import { listMyUploads } from "@/lib/guest/mine";
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
  const mine =
    guest && state === "open"
      ? await listMyUploads(event.id, guest.deviceId)
      : [];
  // Host-uploaded cover if set, otherwise the stock photo for the event type.
  const cover = event.coverKey
    ? { src: await presignGet(event.coverKey), custom: true }
    : { src: eventVisuals[event.type].cover, custom: false };

  return (
    <div className="grain relative flex flex-1 flex-col overflow-hidden bg-[oklch(0.975_0.014_70)] md:items-center md:justify-center md:px-6 md:py-12">
      {/* Ambient light: soft terracotta and peach glows drifting behind everything. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="glow-drift absolute -top-40 -left-32 size-[34rem] rounded-full bg-primary/25 blur-[110px]" />
        <div className="glow-drift absolute -right-40 -bottom-48 size-[38rem] rounded-full bg-[oklch(0.86_0.1_65)]/55 blur-[120px] [animation-delay:-7s]" />
      </div>

      <div className="relative flex w-full flex-1 flex-col md:max-w-[460px] md:flex-none md:overflow-hidden md:rounded-[2.25rem] md:border md:border-white/70 md:bg-white/35 md:shadow-2xl md:ring-1 md:shadow-primary/15 md:ring-black/5 md:backdrop-blur-xl">
        <header className="relative h-64 shrink-0 overflow-hidden bg-foreground">
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
              sizes="(min-width: 768px) 460px, 100vw"
              className="object-cover object-[center_30%]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/0 to-black/70" />
          <div className="relative flex h-full flex-col px-5 pt-4 pb-12">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md">
                <LogoMark className="size-6" />
              </span>
              <div className="[&_option]:text-foreground [&_select]:h-9 [&_select]:rounded-full [&_select]:border-white/25! [&_select]:bg-white/15! [&_select]:px-3 [&_select]:text-[13px] [&_select]:text-white! [&_select]:backdrop-blur-md">
                <LocaleSwitcher />
              </div>
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

        {/* Frosted sheet sliding over the cover, with a thin light edge. */}
        <main className="relative -mt-8 flex-1 rounded-t-[2rem] border-t border-white/80 bg-[oklch(0.985_0.01_75)]/95 px-5 pt-6 pb-8 shadow-[0_-16px_40px_-24px_rgb(60_30_10/0.35)] backdrop-blur-xl">
          {state === "open" ? (
            <>
              <p className="mb-6 text-center text-sm text-pretty text-muted-foreground">
                {t("welcomeSub")}
              </p>
              <Uploader
                slug={event.slug}
                requireName={event.requireName}
                hasPin={Boolean(event.accessPinHash)}
                maxPerDevice={event.maxUploadsPerDevice}
                verified={guest?.verified ?? false}
                initialMine={mine}
                turnstileSiteKey={publicEnv.turnstileSiteKey}
                coverSrc={cover.src}
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
