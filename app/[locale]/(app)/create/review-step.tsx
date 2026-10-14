"use client";

import {
  CalendarHeart,
  Loader2,
  Pencil,
  Receipt,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { devActivate, publishEvent } from "@/lib/events/actions";
import { Link, useRouter } from "@/lib/i18n/navigation";
import type { EVENT_TYPES } from "@/lib/events/schemas";
import { plans } from "@/lib/plans";
import { StepFooter, StepHeading } from "./create-flow";
import { type FlowProps } from "./flow";

function Section({
  icon: Icon,
  title,
  edit,
  rows,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  edit?: React.ReactNode;
  rows: [string, string][];
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-accent text-primary">
          <Icon className="size-4" />
        </span>
        <h2 className="flex-1 font-heading text-base font-semibold">{title}</h2>
        {edit}
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 sm:ps-11">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="truncate font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      {children && <div className="mt-4 sm:ps-11">{children}</div>}
    </section>
  );
}

/** Step 5: everything at a glance, fix what's wrong, then publish. */
export function ReviewStep({ event, devPay }: FlowProps) {
  const t = useTranslations("Create");
  const te = useTranslations("Events");
  const ts = useTranslations("Events.settings");
  const tp = useTranslations("Landing.pricing");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const [publishing, startPublish] = useTransition();
  const [upgrading, startUpgrade] = useTransition();
  if (!event?.plan) return null;
  const ev = event;
  const planId = event.plan;
  const plan = plans[planId];
  const type = ev.type as (typeof EVENT_TYPES)[number];

  const when = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";
  const yes = t("review.on");
  const no = t("review.off");
  const edit = (
    <Button asChild variant="ghost" className="h-8 rounded-full px-3">
      <Link href={`/dashboard/events/${ev.id}?view=settings&from=review`}>
        <Pencil aria-hidden />
        {t("review.edit")}
      </Link>
    </Button>
  );

  function publish() {
    startPublish(async () => {
      const res = await publishEvent(ev.id);
      if (!res.ok) {
        toast.error(t("review.publishFailed"));
        return;
      }
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const confetti = (await import("canvas-confetti")).default;
        confetti({ particleCount: 110, spread: 75, origin: { y: 0.4 } });
      }
      router.push(`/dashboard/events/${ev.id}`);
    });
  }

  return (
    <div>
      <StepHeading title={t("review.title")} subtitle={t("review.subtitle")} />

      <div className="space-y-3">
        <Section
          icon={CalendarHeart}
          title={t("review.event")}
          edit={edit}
          rows={[
            [te("nameLabel"), ev.name],
            [te("typeLabel"), te(`types.${type}`)],
            [te("startLabel"), when(ev.startsAt)],
            [te("endLabel"), when(ev.endsAt)],
          ]}
        />
        <Section
          icon={ShieldCheck}
          title={t("details.guestSettings")}
          edit={edit}
          rows={[
            [ts("requireName"), ev.requireName ? yes : no],
            [ts("pinToggle"), ev.hasPin ? yes : no],
            [
              ts("hoursToggle"),
              ev.uploadOpensAt
                ? `${when(ev.uploadOpensAt)} – ${when(ev.uploadClosesAt)}`
                : no,
            ],
            [
              ts("perPhoneToggle"),
              ev.maxUploadsPerDevice ? String(ev.maxUploadsPerDevice) : no,
            ],
          ]}
        />
        <Section
          icon={Receipt}
          title={t("review.plan")}
          rows={[
            [
              t("review.planName"),
              `${tp(`plans.${planId}.name`)} · ${t("review.paid")}`,
            ],
            [
              t("review.capacity"),
              `${format.number(plan.maxItems)} · ${plan.maxBytes / 1024 ** 3} GB`,
            ],
          ]}
        >
          {planId === "standard" && devPay && (
            <Button
              variant="outline"
              className="h-9 rounded-full bg-card px-4"
              disabled={upgrading}
              onClick={() =>
                startUpgrade(async () => {
                  await devActivate(ev.id, "premium");
                  router.refresh();
                })
              }
            >
              {upgrading ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Sparkles aria-hidden />
              )}
              {t("review.upgrade")}
            </Button>
          )}
        </Section>
      </div>

      <div className="mt-6 rounded-2xl bg-accent/50 p-4 text-sm text-pretty text-muted-foreground ring-1 ring-primary/10">
        {t("review.publishHint")}
      </div>

      <StepFooter>
        <Button
          className="h-12 rounded-full px-7 text-[15px] shadow-[0_10px_24px_-10px_var(--primary)]"
          disabled={publishing}
          onClick={publish}
        >
          {publishing ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Rocket aria-hidden />
          )}
          {publishing ? t("review.publishing") : t("review.publish")}
        </Button>
      </StepFooter>
    </div>
  );
}
