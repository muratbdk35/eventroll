import { Copy, Download } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import QRCode from "qrcode";
import { publicEnv } from "@/lib/public-env";
import { MockButton, MockPanel, MockRow } from "./mock";
import { SectionHeading } from "./section-heading";

// Each step shows the matching app screen, drawn with the shared mock components.

async function CreateMock() {
  const t = await getTranslations("Landing.steps.mock");
  return (
    <MockPanel>
      <MockRow label={t("name")}>Elif & Can</MockRow>
      <MockRow label={t("date")}>{t("dateValue")}</MockRow>
      <MockRow label={t("type")}>{t("typeValue")}</MockRow>
      <MockButton>{t("create")}</MockButton>
    </MockPanel>
  );
}

async function ShareMock() {
  const t = await getTranslations("Landing.steps.mock");
  const svg = await QRCode.toString(publicEnv.appUrl, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 0,
    color: { dark: "#2b211cff", light: "#00000000" },
  });
  return (
    <MockPanel>
      <div className="flex items-center gap-3 px-3.5 py-3">
        <div
          className="size-16 shrink-0"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div className="min-w-0">
          <p className="font-semibold">{t("shareTitle")}</p>
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            eventroll.app/e/k7Qm9xZ2pA
          </p>
        </div>
      </div>
      <div className="flex gap-1.5 p-1.5 pt-0">
        <span className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary text-[12px] font-semibold">
          <Copy className="size-3.5" />
          {t("copy")}
        </span>
        <span className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-[12px] font-semibold text-primary-foreground">
          <Download className="size-3.5" />
          PNG · SVG
        </span>
      </div>
    </MockPanel>
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
    <MockPanel>
      <MockRow label={t("photosLabel")}>1.248</MockRow>
      <div className="grid grid-cols-4 gap-1 p-1.5">
        {thumbs.map((src) => (
          <div
            key={src}
            className="relative aspect-square overflow-hidden rounded-lg"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="70px"
              quality={60}
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <MockButton className="bg-foreground text-background">
        <Download className="size-3.5" />
        {t("zip")}
      </MockButton>
    </MockPanel>
  );
}

const steps = [
  { key: "create", Visual: CreateMock },
  { key: "share", Visual: ShareMock },
  { key: "collect", Visual: CollectMock },
] as const;

export async function HowItWorks() {
  const t = await getTranslations("Landing.steps");
  return (
    <section id="how-it-works" className="scroll-mt-20 px-4 py-24">
      <SectionHeading
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <ol className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3">
        {steps.map(({ key, Visual }, i) => (
          <li
            key={key}
            className="overflow-hidden rounded-3xl border border-border bg-card"
          >
            <div className="flex aspect-[4/3] items-center justify-center bg-secondary px-6">
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
