import { cn } from "@/lib/utils";
import { EventIcon } from "./event-icon";
import type { EventType } from "./event-visuals";

const POSES = [
  "-translate-x-[78%] -rotate-[9deg] group-hover:-translate-x-[92%] group-hover:-rotate-[14deg]",
  "-translate-x-[22%] rotate-[7deg] group-hover:-translate-x-[8%] group-hover:rotate-[12deg]",
  "-translate-x-1/2 -rotate-[1.5deg] group-hover:-translate-y-1.5",
];

/**
 * Three small prints of an event's newest photos (same visual language as the
 * guest page). Empty slots show blank prints with the event-type icon.
 */
export function PhotoStack({
  srcs,
  type,
  className,
}: {
  srcs: string[];
  type: EventType;
  className?: string;
}) {
  return (
    <div className={cn("relative h-36", className)} aria-hidden>
      {[0, 1, 2].map((n) => {
        // The front print (n = 2) shows the newest photo.
        const src = srcs[2 - n];
        return (
          <span
            key={n}
            className={cn(
              "absolute top-2 left-1/2 w-24 rounded-[5px] bg-white p-1.5 pb-5 shadow-lg ring-1 shadow-black/10 ring-black/5 transition-transform duration-500 ease-out",
              POSES[n],
            )}
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
              <img
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
                className="aspect-[4/5] w-full rounded-[3px] object-cover"
              />
            ) : (
              <span className="flex aspect-[4/5] w-full items-center justify-center rounded-[3px] bg-accent/60">
                {n === 2 && (
                  <EventIcon
                    type={type}
                    className="size-10 bg-card shadow-sm"
                  />
                )}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
