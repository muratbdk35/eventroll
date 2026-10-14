import { ChevronRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { EventIcon } from "./event-icon";
import type { EventType } from "./event-visuals";
import { PhotoStack } from "./photo-stack";
import { StatusPill } from "./status-pill";

type Status = React.ComponentProps<typeof StatusPill>["status"];

/**
 * One event on the dashboard: its newest photos as a fanned stack, status,
 * icon, name and a meta line. On phones it collapses to a compact row so a
 * list of events stays scannable; `layout="tall"` always shows the full card
 * (the landing page renders it that way).
 */
export function EventCard({
  href,
  name,
  type,
  status,
  statusLabel,
  meta,
  srcs,
  layout = "responsive",
}: {
  href: string;
  name: string;
  type: EventType;
  status: Status;
  statusLabel: string;
  meta: string;
  srcs: string[];
  layout?: "responsive" | "tall";
}) {
  const responsive = layout === "responsive";
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-[1.75rem] border border-white/70 bg-card p-3 shadow-sm ring-1 ring-black/5 transition-[translate,box-shadow,scale] duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.99]"
    >
      {responsive && (
        <div className="flex items-center gap-3.5 sm:hidden">
          <Thumb src={srcs[0]} type={type} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-[17px] leading-tight font-semibold">
              {name}
            </p>
            <p className="mt-1 truncate text-[13px] text-muted-foreground">
              {meta}
            </p>
            <StatusPill
              status={status}
              label={statusLabel}
              className="mt-2 h-5 px-2 text-[11px]"
            />
          </div>
          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground/70 rtl:rotate-180"
            aria-hidden
          />
        </div>
      )}
      <div
        className={cn(
          "flex-1 flex-col",
          responsive ? "hidden sm:flex" : "flex",
        )}
      >
        <div className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-accent/70 via-accent/30 to-transparent pt-4">
          <PhotoStack srcs={srcs} type={type} />
          <StatusPill
            status={status}
            label={statusLabel}
            className="absolute end-3 top-3 bg-card/90 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3 px-2 pt-4 pb-1.5">
          <EventIcon type={type} className="size-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-lg leading-tight font-semibold">
              {name}
            </p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {meta}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Newest photo as a small tilted print, or the event icon when empty. */
function Thumb({ src, type }: { src?: string; type: EventType }) {
  return (
    <span className="relative size-[4.5rem] shrink-0" aria-hidden>
      <span className="absolute inset-1 -rotate-6 rounded-lg bg-accent shadow-sm ring-1 ring-black/5" />
      <span className="absolute inset-0 rotate-2 overflow-hidden rounded-xl bg-white p-1 shadow-md ring-1 ring-black/5">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
          <img
            src={src}
            alt=""
            className="size-full rounded-lg bg-muted object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center rounded-lg bg-accent/60">
            <EventIcon type={type} className="size-8 bg-card shadow-sm" />
          </span>
        )}
      </span>
    </span>
  );
}
