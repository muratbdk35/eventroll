import { publicEnv } from "@/lib/public-env";
import { cn } from "@/lib/utils";

/** EventRoll "ER" monogram: two overlapping letters in a seal. Original artwork. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <circle cx="16" cy="16" r="16" fill="oklch(0.25 0.02 40)" />
      <g
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
      >
        <path d="M14.6 9.5H9.6v13h5M9.6 16h4.2" stroke="white" />
        <path
          d="M16.9 22.5v-13h3.4a3.4 3.4 0 0 1 0 6.8h-3.4M20 16.3l3.7 6.2"
          stroke="oklch(0.74 0.15 45)"
        />
      </g>
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
