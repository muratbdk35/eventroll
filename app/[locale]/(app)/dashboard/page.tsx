import type { Metadata } from "next";
import { CalendarPlus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { UserMenu } from "@/components/host/user-menu";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { redirect } from "@/lib/i18n/navigation";
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

  const t = await getTranslations("Dashboard");
  const { user } = session;

  return (
    <>
      <SiteHeader>
        <UserMenu name={user.name} email={user.email} image={user.image} />
      </SiteHeader>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {t("greeting", { name: user.name || user.email })}
            </p>
            <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
          </div>
        </div>

        <section className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <CalendarPlus className="size-7" aria-hidden />
          </span>
          <h2 className="font-heading text-xl font-semibold">
            {t("emptyTitle")}
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t("emptyBody")}
          </p>
          <Button
            size="lg"
            className="rounded-xl"
            disabled
            title={t("comingSoon")}
          >
            {t("createEvent")}
          </Button>
        </section>
      </main>
    </>
  );
}
