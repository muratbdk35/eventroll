import { publicEnv } from "@/lib/public-env";
import { cn } from "@/lib/utils";

/** Original EventRoll mark: a film-roll frame with a shutter dot. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-7 text-primary", className)}
    >
      <rect x="3" y="6" width="26" height="20" rx="6" fill="currentColor" />
      <g fill="var(--background)">
        <rect x="6" y="9" width="2.5" height="2.5" rx="0.8" />
        <rect x="6" y="14.75" width="2.5" height="2.5" rx="0.8" />
        <rect x="6" y="20.5" width="2.5" height="2.5" rx="0.8" />
        <rect x="23.5" y="9" width="2.5" height="2.5" rx="0.8" />
        <rect x="23.5" y="14.75" width="2.5" height="2.5" rx="0.8" />
        <rect x="23.5" y="20.5" width="2.5" height="2.5" rx="0.8" />
        <circle cx="16" cy="16" r="5" />
      </g>
      <circle cx="16" cy="16" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-heading text-lg font-bold tracking-tight">
        {publicEnv.appName}
      </span>
    </span>
  );
}
