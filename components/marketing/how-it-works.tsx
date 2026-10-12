import { Download } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { QrCard } from "./qr-card";

// Three steps, each with a small product visual instead of an icon.
async function CreateMock() {
  const t = await getTranslations("Landing.steps.mock");
  const row =
    "flex items-center justify-between rounded-xl bg-background px-3.5 py-2.5 text-[13px] shadow-sm ring-1 ring-border";
  return (
    <div className="w-[82%] rotate-[-2deg] space-y-2">
      <div className={row}>
        <span className="text-muted-foreground">{t("name")}</span>
        <span className="font-semibold">Elif & Can</span>
      </div>
      <div className={row}>
        <span className="text-muted-foreground">{t("date")}</span>
        <span className="font-semibold">{t("dateValue")}</span>
      </div>
      <div className={row}>
        <span className="text-muted-foreground">{t("pin")}</span>
        <span className="flex items-center gap-2">
          <span className="font-mono font-semibold tracking-widest">2468</span>
          <span className="relative h-5 w-9 rounded-full bg-primary">
            <span className="absolute end-0.5 top-0.5 size-4 rounded-full bg-white" />
          </span>
        </span>
      </div>
    </div>
  );
}

async function ShareMock() {
  return (
    <div className="relative size-full">
      <Image
        src="/marketing/table-toast.jpg"
        alt=""
        fill
        sizes="400px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 flex items-center justify-center">
        <QrCard className="origin-center scale-[0.85] rotate-[4deg]" />
      </div>
    </div>
  );
}

async function CollectMock() {
  const t = await getTranslations("Landing.steps.mock");
  const thumbs = [
    "/marketing/rings.jpg",
    "/marketing/cake.jpg",
    "/marketing/dance-floor.jpg",
    "/marketing/toast.jpg",
  ];
  return (
    <div className="w-[82%] rotate-[2deg] rounded-2xl bg-background p-3 shadow-lg ring-1 ring-border">
      <div className="flex items-baseline justify-between text-[12px]">
        <span className="font-semibold">{t("photos", { count: 1248 })}</span>
        <span className="text-muted-foreground">
          {t("guests", { count: 142 })}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1">
        {thumbs.map((src) => (
          <div
            key={src}
            className="relative aspect-square overflow-hidden rounded-md"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="80px"
              quality={60}
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex h-9 items-center justify-center gap-2 rounded-lg bg-foreground text-[12px] font-semibold text-background">
        <Download className="size-3.5" />
        {t("zip")}
      </div>
    </div>
  );
}

const steps = [
  { key: "create", Visual: CreateMock, tone: "bg-accent" },
  { key: "share", Visual: ShareMock, tone: "bg-secondary" },
  { key: "collect", Visual: CollectMock, tone: "bg-[oklch(0.94_0.03_150)]" },
] as const;

export async function HowItWorks() {
  const t = await getTranslations("Landing.steps");
  return (
    <section id="how-it-works" className="scroll-mt-20 px-4 py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-primary">{t("eyebrow")}</p>
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            {t("title")}
          </h2>
        </div>
        <p className="max-w-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <ol className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-3">
        {steps.map(({ key, Visual, tone }, i) => (
          <li
            key={key}
            className="overflow-hidden rounded-3xl border border-border bg-card"
          >
            <div
              aria-hidden
              className={`flex aspect-[4/3] items-center justify-center overflow-hidden ${tone}`}
            >
              <Visual />
            </div>
            <div className="p-6">
              <p className="font-heading text-sm font-bold text-primary">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-1 font-heading text-xl font-semibold">
                {t(`${key}.title`)}
              </h3>
              <p className="mt-2 text-pretty text-muted-foreground">
                {t(`${key}.body`)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
