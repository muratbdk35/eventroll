import { getFormatter, getTranslations } from "next-intl/server";
import QRCode from "qrcode";
import { EventCard } from "@/components/host/event-card";
import { LiveShare } from "@/components/host/live-share";
import { publicEnv } from "@/lib/public-env";
import { AppPreview, CreatePreview } from "./app-previews";
import { SectionHeading } from "./section-heading";
import { optimized } from "@/lib/images";

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
        layout="tall"
        href="/dashboard"
        name="Elif & Can"
        type="wedding"
        status="active"
        statusLabel={te("status.active")}
        meta={`${date}, ${te("photoCount", { count: 1248 })}`}
        srcs={[
          optimized("/marketing/toast.jpg", 256),
          optimized("/marketing/rings.jpg", 256),
          optimized("/marketing/cake.jpg", 256),
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
    <section id="how-it-works" className="scroll-mt-20 px-4 py-16 md:py-24">
      <SectionHeading title={t("title")} subtitle={t("subtitle")} />
      {/* A real sequence, so it is numbered: big numerals, no card chrome. */}
      <ol className="mx-auto mt-12 grid max-w-6xl gap-x-6 gap-y-12 md:grid-cols-3">
        {steps.map(({ key, Visual }, i) => (
          <li key={key} className="min-w-0">
            {/* A tinted tray that reads against the page; screens taller than
                the tray fade out at its bottom edge instead of being cut. */}
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.25rem] bg-[oklch(0.93_0.03_244)] px-4 ring-1 ring-primary/10 ring-inset">
              <Visual />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[oklch(0.93_0.03_244)] to-transparent"
              />
            </div>
            <div className="mt-6 flex gap-4">
              <span className="font-heading text-5xl leading-none font-semibold text-primary/80 tabular-nums">
                {i + 1}
              </span>
              <div>
                <h3 className="font-heading text-xl leading-tight font-semibold">
                  {t(`${key}.title`)}
                </h3>
                <p className="mt-1.5 text-pretty text-muted-foreground">
                  {t(`${key}.body`)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
