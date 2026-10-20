import { cn } from "@/lib/utils";

/**
 * Section opener (DECISIONS #40): a hairline, the title on the left and the
 * explanation beside it on wide screens. No eyebrow labels: the title says
 * what the section is.
 */
export function SectionHeading({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-x-12 gap-y-4 border-t border-foreground/15 pt-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-end",
        className,
      )}
    >
      {/* Long German words hyphenate instead of pushing the page sideways. */}
      <h2 className="font-heading text-[2.4rem] leading-[1.05] font-semibold tracking-[-0.02em] text-balance hyphens-auto [hyphenate-limit-chars:10_4_4] sm:text-6xl">
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-md text-lg leading-relaxed text-pretty text-muted-foreground md:pb-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}
