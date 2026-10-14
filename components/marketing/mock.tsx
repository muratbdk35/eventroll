import { Check, ImagePlus } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * One visual language for every product mock on the marketing site. Mocks must
 * mirror real app screens (DECISIONS #22): the same cards, pills, thumbnails and
 * Halo controls as the dashboard and the guest page (DECISIONS #37).
 */
/** A picked photo as the guest tray shows it: rounded square, soft shadow. */
export function MockThumb({
  src,
  className,
  done = false,
  children,
}: {
  src: string;
  className?: string;
  done?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative", className)}>
      <div className="relative aspect-square overflow-hidden rounded-[9px] bg-muted shadow-[0_4px_10px_-4px_rgba(60,30,10,0.35)] ring-1 ring-black/10 ring-inset">
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
        <span className="absolute end-1 bottom-1 flex size-3.5 items-center justify-center rounded-full bg-success text-white ring-1 ring-white">
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
        "flex items-center rounded-2xl border border-[color-mix(in_oklch,var(--border)_70%,oklch(0.86_0.07_55))] bg-[linear-gradient(to_bottom,white,oklch(0.985_0.01_60))] shadow-[0_6px_14px_-8px_rgba(194,65,12,0.35)]",
        size === "sm" ? "gap-2 p-1.5" : "gap-2.5 p-2",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30",
          size === "sm" ? "size-6" : "size-8",
        )}
      >
        <ImagePlus className={size === "sm" ? "size-3" : "size-4"} />
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
