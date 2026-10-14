import { getFormatter, getTranslations } from "next-intl/server";
import QRCode from "qrcode";
import { EventCard } from "@/components/host/event-card";
import { LiveShare } from "@/components/host/live-share";
import { publicEnv } from "@/lib/public-env";
import { AppPreview, CreatePreview } from "./app-previews";
import { SectionHeading } from "./section-heading";

// Each step shows the real app screen for it (DECISIONS #33): the create flow,
// the "your event is live" card and the dashboard event card.

async function ShareVisual() {
  const svg = await QRCode.toString(`${publicEnv.appUrl}/e/k7Qm9xZ2pA`, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
  });
  return (
    <AppPreview width={600} scale={0.52}>
      <LiveShare
        eventId="preview"
        link={`${publicEnv.appUrl}/e/k7Qm9xZ2pA`}
        qrSvg={svg}
      />
    </AppPreview>
  );
}

async function CollectVisual() {
  const [te, format] = await Promise.all([
    getTranslations("Events"),
    getFormatter(),
  ]);
  const date = format.dateTime(new Date("2026-06-14T12:00:00Z"), {
    dateStyle: "long",
    timeZone: "UTC",
  });
  return (
    <AppPreview width={340} scale={0.82}>
      <EventCard
        href="/dashboard"
        name="Elif & Can"
        type="wedding"
        status="active"
        statusLabel={te("status.active")}
        meta={`${date} · ${te("photoCount", { count: 1248 })}`}
        srcs={[
          "/marketing/toast.jpg",
          "/marketing/rings.jpg",
          "/marketing/cake.jpg",
        ]}
      />
    </AppPreview>
  );
}

function CreateVisual() {
  return (
    <AppPreview width={620} scale={0.5} className="mt-6 self-start">
      <CreatePreview />
    </AppPreview>
  );
}

const steps = [
  { key: "create", Visual: CreateVisual },
  { key: "share", Visual: ShareVisual },
  { key: "collect", Visual: CollectVisual },
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
            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-secondary px-4">
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
