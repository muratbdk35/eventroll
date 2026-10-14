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

/** The guest page's "add more" row shown once photos are picked. */
export function MockAddMore({
  label,
  size = "md",
}: {
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "flex items-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5",
        size === "sm" ? "gap-2 p-1.5" : "gap-2.5 p-2",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30",
          size === "sm" ? "size-6" : "size-8",
        )}
      >
        <Camera
          className={size === "sm" ? "size-3" : "size-4"}
          strokeWidth={1.75}
        />
      </span>
      <span
        className={cn(
          "font-semibold text-foreground",
          size === "sm" ? "text-[10px]" : "text-[11.5px]",
        )}
      >
        {label}
      </span>
    </div>
  );
}
