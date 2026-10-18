"use client";

import {
  CalendarHeart,
  Pencil,
  Receipt,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { HaloButton } from "@/components/halo/halo-button";
import { TicketSettings } from "@/components/host/ticket-settings";
import { devActivate, publishEvent } from "@/lib/events/actions";
import { Link, useRouter } from "@/lib/i18n/navigation";
import type { EVENT_TYPES } from "@/lib/events/schemas";
import { nextPlan, plans } from "@/lib/plans";
import { publicEnv } from "@/lib/public-env";
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
    <section className="rounded-2xl border border-border/80 bg-card/70 p-4 sm:p-5">
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
  const tg = useTranslations("Guest");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const [publishing, startPublish] = useTransition();
  const [upgrading, startUpgrade] = useTransition();
  if (!event?.plan) return null;
  const ev = event;
  const planId = event.plan;
  const plan = plans[planId];
  const upgrade = nextPlan(planId);
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
    <Link
      href={`/dashboard/events/${ev.id}?view=settings&from=review`}
      className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
    >
      <Pencil className="size-3.5" aria-hidden />
      {t("review.edit")}
    </Link>
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

      {/* The ticket guests see at the top of their page, in the colour the
          host picks (#41, #42). */}
      <TicketSettings
        className="mb-7"
        eventId={ev.id}
        initial={ev.ticketColor}
        preview={{
          presenter: publicEnv.appName,
          event: te(`types.${type}`),
          name: ev.name,
          footer: ev.startsAt
            ? format.dateTime(new Date(ev.startsAt), {
                dateStyle: "long",
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              })
            : "",
          stub: tg("ticketStub"),
          watermark: ev.startsAt
            ? String(new Date(ev.startsAt).getFullYear())
            : undefined,
        }}
      />

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
              `${tp(`plans.${planId}.name`)} (${t("review.paid")})`,
            ],
            [
              t("review.capacity"),
              `${format.number(plan.maxItems)}, ${plan.maxBytes / 1024 ** 3} GB`,
            ],
          ]}
        >
          {upgrade && devPay && (
            <HaloButton
              tone="secondary"
              isLoading={upgrading}
              leading={<Sparkles aria-hidden />}
              onClick={() =>
                startUpgrade(async () => {
                  await devActivate(ev.id, upgrade);
                  router.refresh();
                })
              }
            >
              {t("review.upgrade", { plan: tp(`plans.${upgrade}.name`) })}
            </HaloButton>
          )}
        </Section>
      </div>

      <div className="mt-6 rounded-2xl bg-accent/50 p-4 text-sm text-pretty text-muted-foreground ring-1 ring-primary/10">
        {t("review.publishHint")}
      </div>

      <StepFooter>
        <HaloButton
          size="lg"
          isLoading={publishing}
          loadingText={t("review.publishing")}
          leading={<Rocket aria-hidden />}
          onClick={publish}
        >
          {t("review.publish")}
        </HaloButton>
      </StepFooter>
    </div>
  );
}
