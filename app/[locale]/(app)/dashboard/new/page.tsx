import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { UserMenu } from "@/components/host/user-menu";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth";
import { redirect } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { CreateEventForm } from "./create-event-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Events");
  return { title: t("newTitle"), robots: { index: false } };
}

export default async function NewEventPage({
  params,
}: PageProps<"/[locale]/dashboard/new">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) return redirect({ href: "/login", locale });

  const t = await getTranslations("Events");
  const { user } = session;

  return (
    <>
      <SiteHeader>
        <UserMenu name={user.name} email={user.email} image={user.image} />
      </SiteHeader>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        <h1 className="font-heading text-3xl font-bold text-balance">
          {t("newTitle")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("newSubtitle")}</p>
        <CreateEventForm />
      </main>
    </>
  );
}
