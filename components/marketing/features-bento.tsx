import { Check, Eye, Send, ShieldAlert, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import QRCode from "qrcode";
import { EventCard } from "@/components/host/event-card";
import { publicEnv } from "@/lib/public-env";
import { cn } from "@/lib/utils";
import {
  AppPreview,
  ControlPreview,
  PhotosPreview,
  PrintPreview,
  PrivatePreview,
} from "./app-previews";
import { MockAddMore, MockThumb } from "./mock";
import { SectionHeading } from "./section-heading";
import { optimized } from "@/lib/images";

// Bento grid inspired by 21st.dev "Feature Bento" (uilayout). Every tile carries
// its own small visual instead of a generic icon chip.
function Tile({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[1.25rem] bg-[oklch(0.93_0.03_244)] p-5 ring-1 ring-primary/10 ring-inset sm:p-7",
        className,
      )}
    >
      {children}
    </div>
  );
}

function TileText({
  title,
  body,
  className,
}: {
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div className={cn("mt-auto pt-6", className)}>
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-pretty opacity-75">{body}</p>
    </div>
  );
}

/**
 * A slice of the host's gallery with the content check at work (#52): two
 * photos as they are, one blurred with "Needs review" and the two choices.
 */
function ModerationMock({
  badge,
  banner,
  show,
  keep,
}: {
  badge: string;
  banner: string;
  show: string;
  keep: string;
}) {
  const photo = (src: string, className?: string) => (
    <div
      className={cn(
        "clip-round relative overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-black/5",
        className,
      )}
    >
      <Image src={src} alt="" fill sizes="160px" className="object-cover" />
    </div>
  );
  return (
    <div aria-hidden className="w-full max-w-md select-none">
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[13px] font-semibold">
        <ShieldAlert className="size-3.5 text-amber-700" />
        {banner}
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2.5">
        {photo("/marketing/toast.jpg", "aspect-[3/4]")}
        <div className="clip-round relative aspect-[3/4] overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-black/5">
          <Image
            src="/marketing/dance-floor.jpg"
            alt=""
            fill
            sizes="160px"
            className="scale-110 object-cover blur-lg"
          />
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20 p-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white">
              <ShieldAlert className="size-3" />
              {badge}
            </span>
          </span>
        </div>
        {photo("/marketing/cake.jpg", "aspect-[3/4]")}
      </div>
      <div className="mt-2.5 flex justify-center gap-2">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-card px-3 text-xs font-semibold shadow-sm ring-1 ring-black/5">
          <Eye className="size-3.5" />
          {show}
        </span>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm">
          <ShieldCheck className="size-3.5" />
          {keep}
        </span>
      </div>
    </div>
  );
}

// Mini guest page after picking: the "add more" row, the tray and the send
// bar, exactly as guests see it.
/**
 * The phone camera pointed at a table card: viewfinder corners, the QR, and
 * the link the camera offers to open. Step one of "no app".
 */
function ScanMock({ qr, host }: { qr: string; host: string }) {
  return (
    <div
      aria-hidden
      className="relative h-56 w-32 shrink-0 -rotate-2 overflow-hidden rounded-[1.5rem] bg-[oklch(0.22_0.025_245)] shadow-2xl sm:h-80 sm:w-48"
    >
      <Image
        src="/marketing/table-toast.jpg"
        alt=""
        fill
        sizes="200px"
        className="object-cover opacity-45"
      />
      {/* viewfinder corners around the card */}
      <div className="absolute inset-x-5 top-1/2 aspect-square -translate-y-[60%] sm:inset-x-8">
        {[
          "start-0 top-0 border-s-2 border-t-2 rounded-ss-lg",
          "end-0 top-0 border-e-2 border-t-2 rounded-se-lg",
          "start-0 bottom-0 border-s-2 border-b-2 rounded-es-lg",
          "end-0 bottom-0 border-e-2 border-b-2 rounded-ee-lg",
        ].map((c) => (
          <span key={c} className={`absolute size-5 border-white ${c}`} />
        ))}
        <div className="absolute inset-3 rounded-md bg-white p-1.5 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element -- inline QR svg */}
          <img src={qr} alt="" className="size-full" />
        </div>
      </div>
      <span className="absolute inset-x-2.5 bottom-3 truncate rounded-full bg-white/90 px-2.5 py-1.5 text-center text-[10px] font-semibold text-foreground shadow sm:inset-x-4 sm:text-[11px]">
        {host}
      </span>
    </div>
  );
}

/** Step three: the photos arrived (wide screens only). */
async function DoneMock() {
  const t = await getTranslations("Landing.demo");
  return (
    <div
      aria-hidden
      className="hidden w-44 shrink-0 -rotate-1 rounded-[1.25rem] bg-white p-3.5 text-foreground shadow-2xl lg:block"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-success text-white">
        <Check className="size-5" strokeWidth={3} />
      </span>
      <p className="mt-3 text-[13px] leading-snug font-semibold">
        {t("notifyTitle", { count: 12 })}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
        {t("notifyBody")}
      </p>
    </div>
  );
}

async function PickerMock() {
  const t = await getTranslations("Guest");
  return (
    <div
      aria-hidden
      className="relative w-44 shrink-0 rotate-2 rounded-[1.5rem] bg-[oklch(0.985_0.01_245)] p-2.5 shadow-2xl sm:w-64 sm:p-3"
    >
      <MockAddMore size="sm" label={t("chooseMore")} />
      <p className="mt-3 px-0.5 text-[10px] font-semibold text-foreground">
        {t("selected", { count: 3 })}
      </p>
      <div className="mt-1.5 grid grid-cols-3 gap-1.5 px-0.5">
        <MockThumb src="/marketing/cake.jpg" done />
        <MockThumb src="/marketing/confetti.jpg" done />
        <MockThumb src="/marketing/arch-night.jpg">
          <span className="absolute inset-0 flex items-center justify-center bg-black/35">
            <svg viewBox="0 0 36 36" className="size-6 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="white"
                strokeOpacity=".3"
                strokeWidth="3.5"
              />
              <circle
                className="demo-ring"
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray="100"
              />
            </svg>
          </span>
        </MockThumb>
      </div>
      <div className="mt-3 rounded-2xl border border-white/70 bg-white/80 p-1.5 shadow-lg ring-1 shadow-primary/10 ring-black/5">
        <div className="flex h-8 items-center justify-center gap-1.5 rounded-full bg-primary text-[11.5px] font-semibold text-primary-foreground">
          <Send className="size-3.5" />
          {t("send", { count: 3 })}
        </div>
      </div>
    </div>
  );
}

export async function FeaturesBento() {
  const [t, te, tp] = await Promise.all([
    getTranslations("Landing.features"),
    getTranslations("Events"),
    getTranslations("Events.photos"),
  ]);
  const guestLink = `${publicEnv.appUrl}/e/k7Qm9xZ2pA`;
  const qrSvg = await QRCode.toString(guestLink, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
  });
  const qrDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`;

  return (
    <section id="features" className="scroll-mt-20 px-4 pt-16 pb-10 md:py-24">
      <SectionHeading title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto mt-12 grid max-w-6xl gap-3 md:grid-cols-6">
        {/* No app */}
        <Tile className="min-h-[26rem] border-0 bg-primary text-primary-foreground md:col-span-4 md:row-span-2">
          {/* Scan the card, pick photos: the whole guest flow, no app. */}
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <ScanMock qr={qrDataUri} host={new URL(guestLink).host} />
            <PickerMock />
            <DoneMock />
          </div>
          <div className="mt-auto">
            <h3 className="max-w-md font-heading text-3xl leading-tight font-bold sm:text-4xl">
              {t("noApp.title")}
            </h3>
            <p className="mt-3 max-w-lg text-pretty text-primary-foreground">
              {t("noApp.body")}
            </p>
          </div>
        </Tile>

        {/* Private */}
        <Tile className="md:col-span-2">
          <AppPreview width={440} scale={0.68} className="-mx-1">
            <PrivatePreview link={guestLink} />
          </AppPreview>
          <TileText title={t("private.title")} body={t("private.body")} />
        </Tile>

        {/* Originals */}
        <Tile className="border-0 bg-foreground text-background md:col-span-2">
          <div className="-mx-2 h-40 overflow-hidden rounded-2xl">
            <AppPreview width={520} scale={0.58}>
              <PhotosPreview />
            </AppPreview>
          </div>
          <TileText title={t("originals.title")} body={t("originals.body")} />
        </Tile>

        {/* Control */}
        <Tile className="md:col-span-2">
          <AppPreview width={460} scale={0.66} className="-mx-1">
            <ControlPreview />
          </AppPreview>
          <TileText title={t("control.title")} body={t("control.body")} />
        </Tile>

        {/* Print */}
        <Tile className="bg-accent md:col-span-2">
          <span className="absolute end-5 top-5 z-10 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background">
            Premium
          </span>
          <div aria-hidden className="flex justify-center">
            <AppPreview width={210} scale={0.8} className="-rotate-3">
              <PrintPreview />
            </AppPreview>
          </div>
          <TileText title={t("print.title")} body={t("print.body")} />
        </Tile>

        {/* Guests */}
        <Tile className="md:col-span-2">
          {/* The dashboard's event card, guests and photos counted. */}
          <AppPreview width={340} scale={0.88} className="mx-auto">
            <EventCard
              layout="tall"
              href="/dashboard"
              name="Elif & Can"
              type="wedding"
              status="active"
              statusLabel={te("status.active")}
              meta={`${te("photoCount", { count: 1248 })}, ${te("guestsCount", { count: 142 })}`}
              srcs={[
                optimized("/marketing/dance-floor.jpg", 256),
                optimized("/marketing/confetti.jpg", 256),
                optimized("/marketing/table-toast.jpg", 256),
              ]}
            />
          </AppPreview>
          <TileText title={t("guests.title")} body={t("guests.body")} />
        </Tile>

        {/* Content moderation (#52): wide, between the tiles and languages. */}
        <Tile className="md:col-span-6 md:flex-row md:items-center md:gap-10">
          <div className="flex justify-center md:w-1/2">
            <ModerationMock
              badge={tp("flagged")}
              banner={tp("flaggedCount", { count: 1 })}
              show={tp("reveal")}
              keep={tp("approve")}
            />
          </div>
          <TileText
            className="md:mt-0 md:w-1/2 md:pt-0"
            title={t("moderation.title")}
            body={t("moderation.body")}
          />
        </Tile>

        {/* Languages */}
        <Tile className="bg-transparent px-0 pb-0 ring-0 sm:px-0 sm:pb-0 md:col-span-6 md:flex-row md:items-center md:justify-between md:gap-8">
          <div>
            <h3 className="font-heading text-lg font-semibold">
              {t("languages.title")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("languages.body")}
            </p>
          </div>
          <ul aria-hidden className="mt-5 flex flex-wrap gap-2 md:mt-0">
            {["Türkçe", "English", "Deutsch"].map((l) => (
              <li
                key={l}
                className="rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium"
              >
                {l}
              </li>
            ))}
          </ul>
        </Tile>
      </div>
    </section>
  );
}
