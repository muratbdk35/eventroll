import type { Metadata } from "next";
import {
  CalendarDays,
  Images,
  Plus,
  QrCode,
  Ticket,
  Upload,
} from "lucide-react";
import Image from "next/image";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { eventVisuals } from "@/components/host/event-visuals";
import { StatusPill } from "@/components/host/status-pill";
import { UserMenu } from "@/components/host/user-menu";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { listOwnedEvents } from "@/lib/events/queries";
import { Link, redirect } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard");
  return { title: t("title"), robots: { index: false } };
}

export default async function DashboardPage({
  params,
}: PageProps<"/[locale]/dashboard">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) return redirect({ href: "/login", locale });

  const [t, te, format, events] = await Promise.all([
    getTranslations("Dashboard"),
    getTranslations("Events"),
    getFormatter(),
    listOwnedEvents(session.user.id),
  ]);
  const { user } = session;
  const firstName = (user.name || user.email).split(/[\s@]/)[0];

  return (
    <>
      <SiteHeader>
        <UserMenu name={user.name} email={user.email} image={user.image} />
      </SiteHeader>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-primary">
              {t("greeting", { name: firstName })}
            </p>
            <h1 className="mt-1 font-heading text-4xl font-bold tracking-tight">
              {t("title")}
            </h1>
            <p className="mt-2 text-pretty text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
          {events.length > 0 && (
            <Button asChild size="lg" className="h-11 rounded-xl px-5">
              <Link href="/dashboard/new">
                <Plus aria-hidden />
                {t("createEvent")}
              </Link>
            </Button>
          )}
        </div>

        {events.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            body={t("emptyBody")}
            cta={t("createEvent")}
            steps={[t("step1"), t("step2"), t("step3")]}
          />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => {
              const { cover, Icon } = eventVisuals[e.type];
              return (
                <li key={e.id}>
                  <Link
                    href={`/dashboard/events/${e.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_2px_rgb(60_30_10/0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgb(60_30_10/0.45)] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                      <Image
                        src={cover}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                        className="object-cover object-[center_30%] transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/0" />
                      <StatusPill
                        status={e.status}
                        label={te(`status.${e.status}`)}
                        onImage
                        className="absolute start-3 top-3"
                      />
                      <span className="absolute end-3 bottom-3 flex size-9 items-center justify-center rounded-xl bg-white/90 text-foreground shadow-sm backdrop-blur">
                        <Icon className="size-4.5" aria-hidden />
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <h2 className="font-heading text-lg leading-snug font-semibold text-balance">
                        {e.name}
                      </h2>
                      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-4" aria-hidden />
                          {format.dateTime(
                            new Date(`${e.eventDate}T12:00:00Z`),
                            { dateStyle: "medium", timeZone: "UTC" },
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Images className="size-4" aria-hidden />
                          {te("photoCount", { count: e.mediaCount })}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/dashboard/new"
                className="flex h-full min-h-40 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border p-6 text-center text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/40 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:min-h-64"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Plus className="size-6" aria-hidden />
                </span>
                <span className="font-heading text-base font-semibold text-foreground">
                  {t("newEventCard")}
                </span>
                <span className="text-sm">{t("newEventCardBody")}</span>
              </Link>
            </li>
          </ul>
        )}
      </main>
    </>
  );
}

function EmptyState({
  title,
  body,
  cta,
  steps,
}: {
  title: string;
  body: string;
  cta: string;
  steps: string[];
}) {
  const icons = [Ticket, QrCode, Upload];
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card">
      <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-balance">
            {title}
          </h2>
          <p className="mt-3 max-w-md text-pretty text-muted-foreground">
            {body}
          </p>
          <ol className="mt-8 space-y-3">
            {steps.map((step, i) => {
              const Icon = icons[i];
              return (
                <li key={step} className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <span className="font-medium">
                    <span className="me-2 text-muted-foreground tabular-nums">
                      {i + 1}.
                    </span>
                    {step}
                  </span>
                </li>
              );
            })}
          </ol>
          <Button
            asChild
            size="lg"
            className="mt-8 h-12 rounded-xl px-6 text-base"
          >
            <Link href="/dashboard/new">
              <Plus aria-hidden />
              {cta}
            </Link>
          </Button>
        </div>
        <div
          aria-hidden
          className="relative mx-auto hidden aspect-[4/3] w-full max-w-md lg:block"
        >
          {[
            ["/marketing/couple-ribbons.jpg", "start-0 top-6 -rotate-6"],
            ["/marketing/cake.jpg", "end-4 top-0 rotate-3"],
            ["/marketing/dance-floor.jpg", "start-16 bottom-0 rotate-2"],
          ].map(([src, pos]) => (
            <div
              key={src}
              className={`absolute w-[55%] overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_24px_50px_-24px_rgb(60_30_10/0.55)] ${pos}`}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="240px"
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
