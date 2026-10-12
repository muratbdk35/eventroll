import { cn } from "@/lib/utils";

/**
 * One visual language for every product mock on the marketing site. Mocks must
 * mirror real app screens (create form, share tab, settings, dashboard).
 */
export function MockPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "w-full max-w-[19rem] rounded-2xl bg-card p-1.5 text-[13px] text-card-foreground shadow-[0_18px_40px_-22px_rgb(60_30_10/0.45)] ring-1 ring-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MockRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/70 px-3.5 py-2.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{children}</span>
    </div>
  );
}

export function MockToggle() {
  return (
    <span className="relative block h-5 w-9 rounded-full bg-primary">
      <span className="absolute end-0.5 top-0.5 size-4 rounded-full bg-white" />
    </span>
  );
}

export function MockButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "m-1.5 flex h-9 items-center justify-center gap-2 rounded-xl bg-primary text-[12.5px] font-semibold text-primary-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
