import { Download, Heart, Link2, Cake, PartyPopper } from "lucide-react";
import { getTranslations } from "next-intl/server";
import QRCode from "qrcode";
import { publicEnv } from "@/lib/public-env";
import { MockButton, MockDateField, MockPanel, MockPolaroid } from "./mock";
import { SectionHeading } from "./section-heading";

// Each step shows the matching app screen (create form, share bar, event card),
// drawn with the shared mock components and the app's own copy.

async function CreateMock() {
  const [t, te] = await Promise.all([
    getTranslations("Landing.steps.mock"),
    getTranslations("Events"),
  ]);
  const types = [
    { Icon: Heart, label: te("types.wedding"), on: true },
    { Icon: Cake, label: te("types.birthday"), on: false },
    { Icon: PartyPopper, label: te("types.party"), on: false },
  ];
  return (
    <MockPanel className="space-y-2.5 p-3">
      <div className="flex h-9 items-center rounded-xl border border-input bg-card px-3 text-[12px] font-medium">
        Elif & Can
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <MockDateField date={t("startValue")} time={t("startTime")} />
        <MockDateField date={t("endValue")} time={t("endTime")} />
      </div>
      <div className="flex gap-1.5">
        {types.map(({ Icon, label, on }) => (
          <span
            key={label}
            className={
              on
                ? "flex h-7 items-center gap-1 rounded-full border border-primary bg-accent px-2.5 text-[11px] font-medium text-accent-foreground shadow-[inset_0_0_0_1px_var(--primary)]"
                : "flex h-7 items-center gap-1 rounded-full border border-border px-2.5 text-[11px] font-medium text-foreground/70"
            }
          >
            <Icon
              className={
                on ? "size-3 text-primary" : "size-3 text-muted-foreground"
              }
            />
            {label}
          </span>
        ))}
      </div>
      <MockButton>{te("create")}</MockButton>
    </MockPanel>
  );
}

async function ShareMock() {
  const [t, te] = await Promise.all([
    getTranslations("Events.live"),
    getTranslations("Events"),
  ]);
  const svg = await QRCode.toString(publicEnv.appUrl, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 0,
    color: { dark: "#2b211cff", light: "#00000000" },
  });
  return (
    <MockPanel className="p-3">
      <div className="flex items-center gap-3">
        <div
          className="size-14 shrink-0 rounded-xl border border-border bg-white p-1.5"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div className="min-w-0">
          <p className="font-semibold">{t("title")}</p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            {t("body")}
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-1.5">
        <MockButton className="flex-1">
          <Download className="size-3.5" />
          {t("downloadQr")}
        </MockButton>
        <span className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-input bg-background text-[12px] font-semibold">
          <Link2 className="size-3.5" />
          {te("copyLink")}
        </span>
      </div>
    </MockPanel>
  );
}

async function CollectMock() {
  const [t, te] = await Promise.all([
    getTranslations("Landing.steps.mock"),
    getTranslations("Events"),
  ]);
  return (
    <MockPanel className="p-2">
      {/* Event card from the dashboard: newest photos as a fanned stack. */}
      <div className="relative flex h-28 items-start justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-accent/80 via-accent/30 to-transparent pt-3">
        <MockPolaroid
          src="/marketing/rings.jpg"
          tilt={-9}
          className="absolute w-16 -translate-x-[60%]"
        />
        <MockPolaroid
          src="/marketing/cake.jpg"
          tilt={8}
          className="absolute w-16 translate-x-[60%]"
        />
        <MockPolaroid
          src="/marketing/toast.jpg"
          tilt={-2}
          className="absolute w-[4.5rem]"
        />
      </div>
      <div className="flex items-center justify-between gap-2 px-1.5 pt-2.5 pb-1">
        <div>
          <p className="font-heading text-[14px] leading-tight font-semibold">
            Elif & Can
          </p>
          <p className="text-[11px] text-muted-foreground">
            {te("photoCount", { count: 1248 })}
          </p>
        </div>
        <MockButton className="bg-foreground text-background shadow-none">
          <Download className="size-3.5" />
          {t("zip")}
        </MockButton>
      </div>
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
