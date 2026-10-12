import {
  Check,
  Download,
  Eye,
  Languages,
  Lock,
  Printer,
  Users,
} from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

// Bento grid inspired by 21st.dev "Feature Bento" (uilayout), in our warm palette.
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
        "relative overflow-hidden rounded-3xl border border-border bg-card p-7",
        className,
      )}
    >
      {children}
    </div>
  );
}

function TileIcon({
  icon: Icon,
  className,
}: {
  icon: typeof Lock;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground",
        className,
      )}
    >
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

// Mini "photo picker" illustration for the hero tile.
const picks = [
  "/marketing/toast.jpg",
  "/marketing/rings.jpg",
  "/marketing/cake.jpg",
  "/marketing/confetti.jpg",
  "/marketing/sparklers.jpg",
  "/marketing/arch-night.jpg",
];

// Mini "photo picker" showing a guest selecting photos to upload.
async function PickerMock() {
  const t = await getTranslations("Landing.features.noApp");
  return (
    <div
      aria-hidden
      className="absolute end-6 top-6 w-56 rotate-3 rounded-2xl bg-white p-2.5 shadow-2xl sm:end-10 sm:top-10 sm:w-64"
    >
      <div className="grid grid-cols-3 gap-1.5">
        {picks.map((src, i) => (
          <div
            key={src}
            className="relative aspect-square overflow-hidden rounded-md"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="90px"
              quality={60}
              className="object-cover"
            />
            {i !== 4 && (
              <span className="absolute end-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary ring-2 ring-white">
                <Check className="size-2.5 text-white" strokeWidth={3} />
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex h-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
        {t("pickerCta", { count: 5 })}
      </div>
    </div>
  );
}

export async function FeaturesBento() {
  const t = await getTranslations("Landing.features");
  return (
    <section id="features" className="scroll-mt-20 px-4 py-24">
      <SectionHeading
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <div className="mx-auto mt-14 grid max-w-6xl gap-4 md:grid-cols-6">
        <Tile className="flex min-h-[26rem] flex-col justify-end border-0 bg-primary text-primary-foreground md:col-span-4 md:row-span-2">
          <div
            aria-hidden
            className="absolute -end-10 -top-10 size-72 rounded-full bg-white/10"
          />
          <div
            aria-hidden
            className="absolute end-16 top-16 size-40 rounded-full bg-white/10"
          />
          <PickerMock />
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm">
            <span className="size-2 rounded-full bg-white" />
            {t("noApp.badge")}
          </span>
          <h3 className="max-w-md font-heading text-3xl leading-tight font-bold sm:text-4xl">
            {t("noApp.title")}
          </h3>
          <p className="mt-3 max-w-lg text-pretty text-primary-foreground/85">
            {t("noApp.body")}
          </p>
        </Tile>
        <Tile className="md:col-span-2">
          <TileIcon icon={Lock} />
          <h3 className="mt-6 font-heading text-lg font-semibold">
            {t("private.title")}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("private.body")}
          </p>
        </Tile>
        <Tile className="border-0 bg-foreground text-background md:col-span-2">
          <TileIcon
            icon={Download}
            className="bg-background/10 text-background"
          />
          <h3 className="mt-6 font-heading text-lg font-semibold">
            {t("originals.title")}
          </h3>
          <p className="mt-2 text-sm text-background/70">
            {t("originals.body")}
          </p>
        </Tile>
        <Tile className="md:col-span-2">
          <TileIcon icon={Printer} />
          <h3 className="mt-6 font-heading text-lg font-semibold">
            {t("print.title")}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("print.body")}
          </p>
        </Tile>
        <Tile className="md:col-span-2">
          <TileIcon icon={Users} />
          <h3 className="mt-6 font-heading text-lg font-semibold">
            {t("guests.title")}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("guests.body")}
          </p>
        </Tile>
        <Tile className="bg-accent md:col-span-2">
          <TileIcon icon={Eye} className="bg-background text-foreground" />
          <h3 className="mt-6 font-heading text-lg font-semibold">
            {t("gallery.title")}
          </h3>
          <p className="mt-2 text-sm text-accent-foreground/80">
            {t("gallery.body")}
          </p>
        </Tile>
        <Tile className="md:col-span-6 md:flex md:items-center md:gap-6">
          <TileIcon icon={Languages} />
          <div className="mt-6 md:mt-0">
            <h3 className="font-heading text-lg font-semibold">
              {t("languages.title")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("languages.body")}
            </p>
          </div>
        </Tile>
      </div>
    </section>
  );
}
