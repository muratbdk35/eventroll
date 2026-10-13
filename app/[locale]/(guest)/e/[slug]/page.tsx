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
    <div className="flex flex-1 flex-col bg-secondary/60">
      <header className="relative h-60 shrink-0 overflow-hidden bg-foreground sm:h-72">
        <Image
          src={cover}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%] opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/75" />
        <div className="relative mx-auto flex h-full max-w-md flex-col px-5 pt-4 pb-12">
          <div className="flex items-center justify-between">
            <LogoMark className="size-9 drop-shadow" />
            <div className="[&_select]:border-white/30 [&_select]:bg-black/25 [&_select]:text-white [&_select]:backdrop-blur">
              <LocaleSwitcher />
            </div>
          </div>
          <div className="mt-auto text-white">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-80">
              {t("for")}
            </p>
            <h1 className="mt-1 font-heading text-3xl leading-tight font-bold text-balance drop-shadow-sm">
              {event.name}
            </h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto -mt-6 w-full max-w-md flex-1 px-3 pb-10">
        <div className="rounded-[2rem] bg-background p-5 shadow-[0_-8px_30px_-12px_rgb(60_30_10/0.25)] sm:p-6">
          {state === "open" ? (
            <>
              <p className="mb-5 text-center text-sm text-pretty text-muted-foreground">
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
            </>
          ) : (
            <StateMessage
              Icon={stateIcon[state]}
              title={t(`state.${state}.title`)}
              body={t(`state.${state}.body`)}
            />
          )}
        </div>

        {state === "open" && (
          <p className="mx-auto mt-5 flex max-w-xs items-start justify-center gap-2 text-center text-xs text-pretty text-muted-foreground">
            <ShieldCheck
              className="mt-px size-4 shrink-0 text-success"
              aria-hidden
            />
            {t("privacy")}
          </p>
        )}
      </main>
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
    <div className="flex flex-col items-center py-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="size-7" aria-hidden />
      </span>
      <h2 className="mt-4 font-heading text-xl font-semibold text-balance">
        {title}
      </h2>
      <p className="mt-1.5 max-w-xs text-sm text-pretty text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
