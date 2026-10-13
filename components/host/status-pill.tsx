import { cn } from "@/lib/utils";

const dot = {
  active: "bg-success",
  draft: "bg-amber-500",
  expired: "bg-muted-foreground/60",
  suspended: "bg-destructive",
  deleted: "bg-muted-foreground/60",
} as const;

/** Small neutral status badge with a coloured dot. */
export function StatusPill({
  status,
  label,
  className,
}: {
  status: keyof typeof dot;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-md border border-border bg-background px-2 text-[11.5px] font-medium whitespace-nowrap text-foreground/80",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot[status])} aria-hidden />
      {label}
    </span>
  );
}
