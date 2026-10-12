import { Check, Lock } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import { MockPanel, MockRow, MockToggle } from "./mock";
import { QrCard } from "./qr-card";
import { SectionHeading } from "./section-heading";

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
        "relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-7",
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
        {/* No app */}
        <Tile className="min-h-[26rem] border-0 bg-primary text-primary-foreground md:col-span-4 md:row-span-2">
          <div
            aria-hidden
            className="absolute -end-10 -top-10 size-72 rounded-full bg-white/10"
          />
          <PickerMock />
          <div className="mt-auto">
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
          </div>
        </Tile>

        {/* Private */}
        <Tile className="md:col-span-2">
          <MockPanel>
            <MockRow label={t("private.mock.link")}>
              <span className="flex items-center gap-1.5 font-mono text-[12px]">
                <Lock className="size-3 text-success" />
                /e/k7Qm9xZ2pA
              </span>
            </MockRow>
            <MockRow label={t("private.mock.visibility")}>
              {t("private.mock.onlyYou")}
            </MockRow>
          </MockPanel>
          <TileText title={t("private.title")} body={t("private.body")} />
        </Tile>

        {/* Originals */}
        <Tile className="border-0 bg-foreground text-background md:col-span-2">
          <MockPanel>
            <MockRow label={t("originals.mock.resolution")}>
              4032 × 3024
            </MockRow>
            <MockRow label={t("originals.mock.file")}>HEIC · 3,8 MB</MockRow>
          </MockPanel>
          <TileText title={t("originals.title")} body={t("originals.body")} />
        </Tile>

        {/* Control */}
        <Tile className="md:col-span-2">
          <MockPanel>
            <MockRow label={t("control.mock.pin")}>
              <MockToggle />
            </MockRow>
            <MockRow label={t("control.mock.hours")}>18:00 – 02:00</MockRow>
            <MockRow label={t("control.mock.limit")}>50</MockRow>
          </MockPanel>
          <TileText title={t("control.title")} body={t("control.body")} />
        </Tile>

        {/* Print */}
        <Tile className="bg-accent md:col-span-2">
          <span className="absolute end-5 top-5 z-10 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background">
            Premium
          </span>
          <div aria-hidden className="-mt-2 flex justify-center">
            <QrCard className="origin-top scale-[0.72] -rotate-3" />
          </div>
          <TileText
            title={t("print.title")}
            body={t("print.body")}
            className="-mt-14"
          />
        </Tile>

        {/* Guests */}
        <Tile className="md:col-span-2">
          <MockPanel>
            <MockRow label={t("guests.mock.guests")}>
              <span className="flex items-center -space-x-1.5 rtl:space-x-reverse">
                {["S", "M", "A", "E"].map((l, i) => (
                  <span
                    key={l}
                    className="flex size-6 items-center justify-center rounded-full text-[10px] text-white ring-2 ring-card"
                    style={{
                      background: `oklch(${0.6 + i * 0.04} 0.13 ${30 + i * 30})`,
                    }}
                  >
                    {l}
                  </span>
                ))}
                <span className="ps-3">142</span>
              </span>
            </MockRow>
            <MockRow label={t("guests.mock.limit")}>
              {t("guests.mock.none")}
            </MockRow>
          </MockPanel>
          <TileText title={t("guests.title")} body={t("guests.body")} />
        </Tile>

        {/* Languages */}
        <Tile className="md:col-span-6 md:flex-row md:items-center md:justify-between md:gap-8">
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
