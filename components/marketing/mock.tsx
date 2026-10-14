import { CalendarDays, Camera, Check } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * One visual language for every product mock on the marketing site. Mocks must
 * mirror real app screens (DECISIONS #22): the same cards, pills, polaroids and
 * shutter button as the dashboard and the guest page (DECISIONS #26, #27).
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
        "w-full max-w-[19rem] rounded-3xl border border-white/70 bg-card p-2 text-[13px] text-card-foreground shadow-[0_22px_45px_-24px_rgb(60_30_10/0.45)] ring-1 ring-black/5",
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
    <div className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{children}</span>
    </div>
  );
}

/** The settings switch (components/ui/switch.tsx), on. */
export function MockToggle() {
  return (
    <span className="relative block h-5 w-9 rounded-full bg-primary">
      <span className="absolute end-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm" />
    </span>
  );
}

/** Primary pill button, as in the app. */
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
        "flex h-9 items-center justify-center gap-1.5 rounded-full bg-primary px-3.5 text-[12px] font-semibold text-primary-foreground shadow-[0_8px_18px_-8px_var(--primary)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The date-time field (components/ui/date-time-field.tsx). */
export function MockDateField({ date, time }: { date: string; time: string }) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-2xl border border-input bg-card ps-1.5 pe-2 text-[11.5px] shadow-xs">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
        <CalendarDays className="size-3" />
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{date}</span>
      <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums">
        {time}
      </span>
    </div>
  );
}

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
