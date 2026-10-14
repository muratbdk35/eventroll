import { ChevronRight, Download, Printer } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { CopyLinkButton } from "./copy-link-button";

/** Replaces the checklist once the event is published (DECISIONS #31). */
export async function LiveShare({
  eventId,
  link,
}: {
  eventId: string;
  link: string;
}) {
  const t = await getTranslations("Events.live");
  const eventPath = `/dashboard/events/${eventId}`;
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -end-16 -top-20 size-56 rounded-full bg-primary/15 blur-3xl"
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="shrink-0 self-center rounded-2xl border border-border bg-white p-2 shadow-xs sm:self-auto">
          {/* eslint-disable-next-line @next/next/no-img-element -- generated per event, authenticated */}
          <img
            src={`/api/events/${eventId}/qr?format=svg`}
            alt=""
            width={112}
            height={112}
            className="size-28"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-heading text-lg font-semibold">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2.5 rounded-full bg-success" />
            </span>
            {t("title")}
          </p>
          <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
            {t("body")}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button asChild className="h-9 rounded-full px-4">
              <a href={`/api/events/${eventId}/qr?format=png&download`}>
                <Download aria-hidden />
                {t("downloadQr")}
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-9 rounded-full bg-card px-4"
            >
              <Link href={`${eventPath}?view=print`}>
                <Printer aria-hidden />
                {t("templates")}
              </Link>
            </Button>
            <CopyLinkButton
              link={link}
              className="h-9 rounded-full bg-card px-4"
            />
            <Link
              href={`${eventPath}?view=share`}
              className="inline-flex h-9 items-center gap-0.5 px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("allOptions")}
              <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
