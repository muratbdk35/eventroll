import { publicEnv } from "@/lib/public-env";
import { cn } from "@/lib/utils";

/**
 * EventRoll mark: a QR "finder eye" that doubles as a camera lens, with a
 * small spark for the moment it captures. Original artwork.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <rect width="32" height="32" rx="9.5" className="fill-primary" />
      <rect
        x="7.5"
        y="7.5"
        width="17"
        height="17"
        rx="5.5"
        fill="none"
        stroke="white"
        strokeWidth="3"
      />
      <rect
        x="12.75"
        y="12.75"
        width="6.5"
        height="6.5"
        rx="2.2"
        fill="white"
      />
      <path
        d="M26.2 3.2c.25 1.6.95 2.3 2.6 2.6-1.65.3-2.35 1-2.6 2.6-.25-1.6-.95-2.3-2.6-2.6 1.65-.3 2.35-1 2.6-2.6Z"
        fill="oklch(0.93 0.07 75)"
      />
    </svg>
  );
}

/** Splits the brand name so the second word can carry the accent colour. */
function splitName(name: string): [string, string] {
  const m = name.match(/^(.+?)([A-Z][a-z]+)$/);
  return m ? [m[1], m[2]] : [name, ""];
}

export function Logo({ className }: { className?: string }) {
  const [first, second] = splitName(publicEnv.appName);
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-heading text-xl font-extrabold tracking-tight">
        {first}
        <span className="text-primary">{second}</span>
      </span>
    </span>
  );
}
