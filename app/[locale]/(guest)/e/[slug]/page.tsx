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
  const { cover } = eventVisuals[event.type];

  return (
    <div className="relative flex flex-1 flex-col bg-background md:items-center md:justify-center md:bg-foreground md:px-6 md:py-12">
      {/* Desktop: the cover, blurred, fills the screen behind an invitation-style card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block"
      >
        <Image
          src={cover}
          alt=""
          fill
          sizes="100vw"
          className="scale-110 object-cover opacity-45 blur-2xl"
        />
      </div>

      <div className="relative flex w-full flex-1 flex-col bg-background md:max-w-[440px] md:flex-none md:overflow-hidden md:rounded-3xl md:shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)] md:ring-1 md:ring-white/10">
        <header className="relative h-56 shrink-0 overflow-hidden bg-foreground md:h-60">
          <Image
            src={cover}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 440px, 100vw"
            className="object-cover object-[center_30%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/5 to-black/75" />
          <div className="relative flex h-full flex-col px-5 pt-4 pb-5">
            <div className="flex items-center justify-between">
              <LogoMark className="size-8 text-white drop-shadow" />
              <div className="[&_option]:text-foreground [&_select]:h-8 [&_select]:border-white/25! [&_select]:bg-black/35! [&_select]:pe-1 [&_select]:text-[13px] [&_select]:text-white! [&_select]:backdrop-blur">
                <LocaleSwitcher />
              </div>
            </div>
            <div className="mt-auto text-white">
              <p className="text-[11px] font-medium tracking-[0.16em] uppercase opacity-80">
                {t("for")}
              </p>
              <h1 className="mt-0.5 text-2xl leading-tight font-semibold tracking-tight text-balance">
                {event.name}
              </h1>
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 pt-5 pb-8 md:pb-6">
          {state === "open" ? (
            <>
              <p className="mb-5 text-sm text-pretty text-muted-foreground">
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
              />
              <p className="mt-8 flex items-start gap-2 border-t border-border pt-4 text-xs text-pretty text-muted-foreground md:mt-6">
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
      <span className="flex size-11 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-balance">{title}</h2>
      <p className="mt-1 max-w-xs text-sm text-pretty text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
