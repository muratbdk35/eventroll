"use client";

import { KeyRound, Smartphone, UserRound } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { FlowShell } from "@/app/[locale]/(app)/create/create-flow";
import { DetailsQuestions } from "@/app/[locale]/(app)/create/details-step";
import { emptyDraft } from "@/app/[locale]/(app)/create/draft";
import { GuestLinkField } from "@/components/host/guest-link-field";
import { PhotoGrid } from "@/components/host/photo-grid";
import { Row } from "@/components/host/settings-form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { optimized } from "@/lib/images";

// Landing visuals are the real app components (DECISIONS #33), rendered at a
// fixed width, scaled down with `zoom` and made inert. Nothing here is a
// redrawn copy, so the landing page cannot drift from the product.

const ignore = () => {};

/** Renders real UI at `width` px, scaled by `scale`, non-interactive. */
export function AppPreview({
  width,
  scale,
  className,
  children,
}: {
  width: number;
  scale: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div aria-hidden inert className={className} style={{ width, zoom: scale }}>
      <div className="pointer-events-none select-none">{children}</div>
    </div>
  );
}

// Fixed dates: `emptyDraft()` reads the clock and would differ between the
// server render and hydration.
const previewDraft = {
  ...emptyDraft(),
  name: "Elif & Can",
  type: "wedding" as const,
  starts: "2026-06-14T19:00",
  ends: "2026-06-15T02:00",
};

/** Step 1 of the create flow on its "what are you celebrating" question. */
export function CreatePreview() {
  return (
    <FlowShell step="details" exit="/">
      <DetailsQuestions
        draft={previewDraft}
        setDraft={ignore}
        item="type"
        onItemChange={ignore}
        onDone={ignore}
      />
    </FlowShell>
  );
}

/** The share view's link field under its heading. */
export function PrivatePreview({ link }: { link: string }) {
  const t = useTranslations("Events.share");
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-heading text-lg font-semibold">{t("title")}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{t("hint")}</p>
      <div className="mt-4">
        <GuestLinkField link={link} id="lp-guest-link" />
      </div>
    </section>
  );
}

/** Real settings rows with their switches on. */
export function ControlPreview() {
  const t = useTranslations("Events.settings");
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="divide-y divide-border">
        <Row
          icon={KeyRound}
          title={t("pinToggle")}
          description={t("pinHint")}
          control={<Switch checked aria-label={t("pinToggle")} />}
        >
          <Input
            readOnly
            value="2468"
            aria-label={t("pinLabel")}
            className="h-9 max-w-40 text-center font-mono tracking-[0.35em]"
          />
        </Row>
        <Row
          icon={UserRound}
          title={t("requireName")}
          description={t("requireNameHint")}
          control={<Switch checked aria-label={t("requireName")} />}
        />
        <Row
          icon={Smartphone}
          title={t("perPhoneToggle")}
          description={t("perPhoneHint")}
          control={<Switch checked aria-label={t("perPhoneToggle")} />}
        >
          <Input
            readOnly
            value="50"
            aria-label={t("perPhone")}
            className="h-9 max-w-28"
          />
        </Row>
      </div>
    </section>
  );
}

/**
 * One printed table card from the print templates: a PNG drawn by the
 * real template code (scripts/render-print-card.tsx), one per language.
 */
export function PrintPreview() {
  const locale = useLocale();
  return (
    <Image
      src={`/marketing/print-card-${locale}.png`}
      alt=""
      width={380}
      height={552}
      sizes="210px"
      className="h-auto w-[210px] drop-shadow-[0_18px_24px_rgb(20_35_60/0.28)]"
    />
  );
}

const photos = [
  "toast.jpg",
  "rings.jpg",
  "dance-floor.jpg",
  "cake.jpg",
  "sparklers.jpg",
  "confetti.jpg",
].map((f, i) => ({
  id: `lp-${i}`,
  src: optimized(`/marketing/${f}`, 384),
  full: optimized(`/marketing/${f}`, 1080),
  download: `/marketing/${f}`,
  bytes: 0,
  uploaderName: null,
  canBlock: false,
  createdAt: "2026-06-14T20:00:00.000Z",
  width: 4,
  height: i % 3 === 1 ? 5 : 4,
}));

/** The event page's photo grid. */
export function PhotosPreview() {
  return <PhotoGrid eventId="preview" photos={photos} published />;
}
