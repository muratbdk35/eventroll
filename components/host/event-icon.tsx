import { cn } from "@/lib/utils";
import { eventVisuals, type EventType } from "./event-visuals";

/** Warm round badge with the event-type icon (used instead of cover photos). */
export function EventIcon({
  type,
  className,
}: {
  type: EventType;
  className?: string;
}) {
  const { Icon } = eventVisuals[type];
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary",
        className,
      )}
    >
      <Icon className="size-[45%]" aria-hidden />
    </span>
  );
}
