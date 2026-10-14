import { Link } from "@/lib/i18n/navigation";
import { EventIcon } from "./event-icon";
import type { EventType } from "./event-visuals";
import { PhotoStack } from "./photo-stack";
import { StatusPill } from "./status-pill";

type Status = React.ComponentProps<typeof StatusPill>["status"];

/**
 * One event on the dashboard: its newest photos as a fanned stack, status,
 * icon, name and a meta line. The landing page renders this same card.
 */
export function EventCard({
  href,
  name,
  type,
  status,
  statusLabel,
  meta,
  srcs,
}: {
  href: string;
  name: string;
  type: EventType;
  status: Status;
  statusLabel: string;
  meta: string;
  srcs: string[];
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-[1.75rem] border border-white/70 bg-card/85 p-3 shadow-sm ring-1 ring-black/5 backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.99]"
    >
      <div className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-accent/70 via-accent/30 to-transparent pt-4">
        <PhotoStack srcs={srcs} type={type} />
        <StatusPill
          status={status}
          label={statusLabel}
          className="absolute end-3 top-3 bg-card/90 shadow-sm backdrop-blur"
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
    </Link>
  );
}
