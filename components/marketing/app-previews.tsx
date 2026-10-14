"use client";

import { ArrowRight, Clock, KeyRound, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  FlowCard,
  StepFooter,
  StepHeading,
} from "@/app/[locale]/(app)/create/create-flow";
import { TypeChips } from "@/app/[locale]/(app)/create/details-step";
import { GuestLinkField } from "@/components/host/guest-link-field";
import { PhotoGrid } from "@/components/host/photo-grid";
import { Face } from "@/components/host/print-templates";
import { Row } from "@/components/host/settings-form";
import { Button } from "@/components/ui/button";
import { DateTimeField } from "@/components/ui/date-time-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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

/** Step 1 of the create flow, as hosts see it. */
export function CreatePreview() {
  const t = useTranslations("Create");
  const te = useTranslations("Events");
  return (
    <FlowCard step="details" exit="/">
      <StepHeading title={t("details.title")} />
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="lp-name">{te("nameLabel")}</Label>
          <Input
            id="lp-name"
            readOnly
            value="Elif & Can"
            className="h-11 text-base"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{te("startLabel")}</Label>
            <DateTimeField value="2026-06-14T19:00" onChange={ignore} />
          </div>
          <div className="space-y-2">
            <Label>{te("endLabel")}</Label>
            <DateTimeField value="2026-06-15T02:00" onChange={ignore} />
          </div>
        </div>
        <TypeChips value="wedding" onChange={ignore} />
      </div>
      <StepFooter>
        <Button className="h-11 rounded-full px-6">
          {t("details.next")}
          <ArrowRight aria-hidden />
        </Button>
      </StepFooter>
    </FlowCard>
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
          icon={Clock}
          title={t("hoursToggle")}
          description={t("hoursHint")}
          control={<Switch checked aria-label={t("hoursToggle")} />}
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

/** One printed table card from the Premium templates. */
export function PrintPreview({ qr }: { qr: string }) {
  const t = useTranslations("Events.print");
  return (
    <div className="h-[296px] w-[210px] overflow-hidden rounded-[6px] shadow-xl ring-1 ring-black/10">
      <Face
        qr={qr}
        color="terracotta"
        layout="column"
        text={{
          eventName: "Elif & Can",
          date: "14.06.2026",
          headline: t("headlineDefault"),
          subline: t("subline"),
          steps: t("steps"),
          noApp: t("noApp"),
        }}
      />
    </div>
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
  src: `/marketing/${f}`,
  full: `/marketing/${f}`,
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
