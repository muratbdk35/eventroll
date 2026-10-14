import { Camera, Check } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * One visual language for every product mock on the marketing site. Mocks must
 * mirror real app screens (DECISIONS #22): the same cards, pills, polaroids and
 * shutter button as the dashboard and the guest page (DECISIONS #26, #27).
 */
/** A small print with a white border, like the guest tray and event cards. */
export function MockPolaroid({
  src,
  tilt = 0,
  className,
  done = false,
  children,
}: {
  src: string;
  tilt?: number;
  className?: string;
  done?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative rounded-[5px] bg-white p-1 pb-3.5 shadow-lg ring-1 shadow-black/15 ring-black/5",
        className,
      )}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="relative aspect-square overflow-hidden rounded-[3px] bg-muted">
        <Image
          src={src}
          alt=""
          fill
          sizes="90px"
          quality={60}
          className="object-cover"
        />
        {children}
      </div>
      {done && (
        <span className="absolute end-1 bottom-0.5 flex size-3.5 items-center justify-center rounded-full bg-success text-white">
          <Check className="size-2" strokeWidth={4} />
        </span>
      )}
    </div>
  );
}

/** The guest page's hero: a fanned pile of prints and the shutter button. */
export function MockDeck({
  srcs,
  size = "md",
}: {
  srcs: [string, string, string];
  size?: "sm" | "md";
}) {
  const card = size === "sm" ? "w-16" : "w-[5.5rem]";
  return (
    <div className={cn("relative", size === "sm" ? "h-24 w-28" : "h-32 w-36")}>
      {[
        "-translate-x-[75%] -rotate-[9deg]",
        "-translate-x-[25%] rotate-[8deg]",
        "-translate-x-1/2 -rotate-[2deg]",
      ].map((pose, n) => (
        <div
          key={n}
          className={cn(
            "absolute top-0 left-1/2 rounded-[5px] bg-white p-1 pb-3 shadow-xl ring-1 shadow-black/15 ring-black/5",
            card,
            pose,
          )}
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-[3px]">
            <Image
              src={srcs[n]}
              alt=""
              fill
              sizes="90px"
              quality={60}
              className="object-cover"
            />
          </div>
        </div>
      ))}
      <span
        className={cn(
          "absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl ring-4 shadow-primary/40 ring-white",
          size === "sm" ? "size-9" : "size-11",
        )}
      >
        <Camera
          className={size === "sm" ? "size-4" : "size-5"}
          strokeWidth={1.75}
        />
      </span>
    </div>
  );
}
