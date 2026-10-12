import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      <p className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-balance sm:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg text-pretty text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}
