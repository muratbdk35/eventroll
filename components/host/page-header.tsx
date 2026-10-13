import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/** Sticky top bar of a dashboard page: breadcrumb on the left, actions on the right. */
export function PageHeader({
  crumbs,
  actions,
}: {
  crumbs: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 hidden h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/85 px-6 backdrop-blur md:flex">
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-1.5 text-[13.5px]">
          {crumbs.map((c, i) => (
            <Fragment key={c.label}>
              {i > 0 && (
                <ChevronRight
                  className="size-3.5 shrink-0 text-muted-foreground/60 rtl:rotate-180"
                  aria-hidden
                />
              )}
              <li className="min-w-0 truncate">
                {c.href ? (
                  <Link
                    href={c.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-medium">
                    {c.label}
                  </span>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

/** Standard content column for dashboard pages. */
export function PageBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:py-8",
        className,
      )}
    >
      {children}
    </main>
  );
}
