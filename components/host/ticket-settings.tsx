"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { EventTicket } from "@/components/ui/event-ticket";
import { updateTicket } from "@/lib/events/actions";
import {
  TICKET_COLORS,
  ticketColors,
  type TicketColor,
} from "@/lib/events/ticket";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * The guest ticket's colour (DECISIONS #42): live preview and swatches, on
 * every plan. The ticket's design itself never changes.
 */
export function TicketSettings({
  eventId,
  initial,
  preview,
  className,
}: {
  eventId: string;
  initial: TicketColor;
  preview: {
    presenter: string;
    event: string;
    name: string;
    footer: string;
    stub: string;
    watermark?: string;
  };
  className?: string;
}) {
  const t = useTranslations("Events.ticket");
  const router = useRouter();
  const [color, setColor] = useState(initial);
  const [pending, start] = useTransition();

  function choose(next: TicketColor) {
    const before = color;
    setColor(next);
    start(async () => {
      const res = await updateTicket(eventId, next);
      if (res.ok) {
        toast.success(t("saved"));
        router.refresh();
      } else {
        setColor(before);
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
      <h2 className="font-heading text-lg font-semibold">{t("title")}</h2>
      <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
        {t("hint")}
      </p>

      <EventTicket className="mt-5" maxWidth={460} color={color} {...preview} />

      <fieldset disabled={pending} className="mt-6">
        <legend className="text-sm font-medium">{t("color")}</legend>
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          {ticketColors.map((id) => {
            const c = TICKET_COLORS[id];
            const on = color === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                aria-label={t(`colors.${id}`)}
                title={t(`colors.${id}`)}
                onClick={() => !on && choose(id)}
                className={cn(
                  "relative flex size-10 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait",
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
      </fieldset>
    </section>
  );
}
