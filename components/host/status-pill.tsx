import { cn } from "@/lib/utils";

const tone = {
  active: "bg-success/12 text-success ring-success/25",
  draft: "bg-amber-500/12 text-amber-700 ring-amber-500/25",
  expired: "bg-muted text-muted-foreground ring-border",
  suspended: "bg-destructive/10 text-destructive ring-destructive/25",
  deleted: "bg-muted text-muted-foreground ring-border",
} as const;

/** Status chip with a live dot. `onImage` gives it a solid ground over photos. */
export function StatusPill({
  status,
  label,
  onImage = false,
  className,
}: {
  status: keyof typeof tone;
  label: string;
  onImage?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ring-1",
        onImage
          ? "bg-white/90 text-foreground ring-black/5 backdrop-blur"
          : tone[status],
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "active"
            ? "animate-pulse bg-success"
            : status === "draft"
              ? "bg-amber-500"
              : status === "suspended"
                ? "bg-destructive"
                : "bg-muted-foreground",
        )}
      />
      {label}
    </span>
  );
}
