import { cn } from "@/lib/utils";

const tone = {
  active: "bg-live/10 text-live",
  draft: "bg-amber-500/12 text-amber-800",
  expired: "bg-muted text-muted-foreground",
  suspended: "bg-destructive/10 text-destructive",
  deleted: "bg-muted text-muted-foreground",
} as const;

const dot = {
  active: "bg-live",
  draft: "bg-amber-500",
  expired: "bg-muted-foreground/60",
  suspended: "bg-destructive",
  deleted: "bg-muted-foreground/60",
} as const;

/**
 * Soft, tinted status chip with a dot. A live event is green (DECISIONS
 * #40, revised: the owner found red read as an error).
 */
export function StatusPill({
  status,
  label,
  className,
}: {
  status: keyof typeof tone;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap",
        tone[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot[status])} aria-hidden />
      {label}
    </span>
  );
}
