import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LogoMark } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getEventBySlug } from "@/lib/events/queries";
import { getUploadState } from "@/lib/events/upload-state";
import { getGuestSession } from "@/lib/guest/session";
import { listMyUploads } from "@/lib/guest/mine";
import type { Locale } from "@/lib/i18n/routing";
import { publicEnv } from "@/lib/public-env";
import { Uploader } from "./uploader";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

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

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <div className="flex items-center justify-between">
        <LogoMark className="size-9" />
        <LocaleSwitcher />
      </div>

      <header className="space-y-2 text-center">
        <h1 className="font-heading text-2xl font-bold text-balance">
          {state === "open"
            ? t("welcome", { event: event.name })
            : t(`state.${state}.title`)}
        </h1>
        <p className="text-sm text-pretty text-muted-foreground">
          {state === "open" ? t("welcomeSub") : t(`state.${state}.body`)}
        </p>
      </header>

      {state === "open" && (
        <>
          <Uploader
            slug={event.slug}
            requireName={event.requireName}
            hasPin={Boolean(event.accessPinHash)}
            maxPerDevice={event.maxUploadsPerDevice}
            verified={guest?.verified ?? false}
            initialMine={mine}
            turnstileSiteKey={publicEnv.turnstileSiteKey}
          />
          <p className="flex items-start justify-center gap-2 text-center text-xs text-pretty text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {t("privacy")}
          </p>
        </>
      )}
    </main>
  );
}
