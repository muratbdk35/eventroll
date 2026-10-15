"use client";

import { Check, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { HaloButton } from "@/components/halo/halo-button";
import { EventTicket } from "@/components/ui/event-ticket";
import { devActivate, updateTicket } from "@/lib/events/actions";
import {
  TICKET_COLORS,
  ticketColors,
  ticketPatterns,
  type TicketColor,
  type TicketPattern,
} from "@/lib/events/ticket";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * The guest ticket's look (DECISIONS #42): live preview, colour swatches and
 * patterns. Every plan sees it. Standard can try every style in the preview
 * (nothing is saved) and is offered Premium to keep it (#44).
 */
export function TicketSettings({
  eventId,
  allowed,
  initial,
  preview,
  devPay = false,
  className,
}: {
  eventId: string;
  allowed: boolean;
  initial: { color: TicketColor; pattern: TicketPattern };
  preview: {
    presenter: string;
    event: string;
    name: string;
    footer: string;
    stub: string;
  };
  /** Dev only: offer the stand-in upgrade until Stripe is wired up. */
  devPay?: boolean;
  className?: string;
}) {
  const t = useTranslations("Events.ticket");
  const router = useRouter();
  const [style, setStyle] = useState(initial);
  const [pending, start] = useTransition();
  const [upgrading, startUpgrade] = useTransition();
  const tried =
    !allowed &&
    (style.color !== initial.color || style.pattern !== initial.pattern);

  function choose(next: Partial<typeof style>) {
    const merged = { ...style, ...next };
    if (!allowed) {
      // Try before you buy: the preview changes, nothing is saved.
      setStyle(merged);
      return;
    }
    const before = style;
    setStyle(merged);
    start(async () => {
      const res = await updateTicket(eventId, merged);
      if (res.ok) {
        toast.success(t("saved"));
        router.refresh();
      } else {
        setStyle(before);
        toast.error(t("failed"));
      }
    });
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">{t("title")}</h2>
          <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
            {t("hint")}
          </p>
        </div>
        {!allowed && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background">
            <Sparkles className="size-3" aria-hidden />
            Premium
          </span>
        )}
      </div>

      <EventTicket
        className="mt-5"
        maxWidth={460}
        color={style.color}
        pattern={style.pattern}
        {...preview}
      />

      {!allowed && (
        <p
          id="ticket-try"
          aria-live="polite"
          className={cn(
            "mt-3 text-center text-sm text-pretty",
            tried ? "font-medium text-primary" : "text-muted-foreground",
          )}
        >
          {tried ? t("preview") : t("tryHint")}
        </p>
      )}

      <fieldset
        disabled={pending || upgrading}
        className="mt-6 disabled:opacity-60"
        aria-describedby={allowed ? undefined : "ticket-try"}
      >
        <legend className="text-sm font-medium">{t("color")}</legend>
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          {ticketColors.map((id) => {
            const c = TICKET_COLORS[id];
            const on = style.color === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                aria-label={t(`colors.${id}`)}
                title={t(`colors.${id}`)}
                onClick={() => choose({ color: id })}
                className={cn(
                  "relative flex size-10 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
                  on && "ring-2 ring-foreground",
                )}
                style={{
                  background: `linear-gradient(135deg, ${c.back} 50%, ${c.front} 50%)`,
                }}
              >
                {on && (
                  <Check
                    className="size-4"
                    style={{ color: c.ink }}
                    strokeWidth={3}
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-sm font-medium" id="ticket-pattern">
          {t("pattern")}
        </p>
        <div
          role="group"
          aria-labelledby="ticket-pattern"
          className="mt-2.5 flex flex-wrap gap-2"
        >
          {ticketPatterns.map((id) => {
            const on = style.pattern === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => choose({ pattern: id })}
                className={cn(
                  "h-9 rounded-full border px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
                  on
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background hover:bg-muted",
                )}
              >
                {t(`patterns.${id}`)}
              </button>
            );
          })}
        </div>
      </fieldset>
      {tried && devPay && (
        <HaloButton
          className="mt-5"
          isLoading={upgrading}
          leading={<Sparkles aria-hidden />}
          onClick={() =>
            startUpgrade(async () => {
              await devActivate(eventId, "premium");
              const res = await updateTicket(eventId, style);
              if (res.ok) toast.success(t("upgraded"));
              router.refresh();
            })
          }
        >
          {t("upgrade")}
        </HaloButton>
      )}
    </section>
  );
}
