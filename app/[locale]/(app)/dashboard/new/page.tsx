import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BackLink, PageBody } from "@/components/host/page-header";
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
  const t = await getTranslations("Events");

  return (
    <PageBody className="max-w-xl">
      <BackLink href="/dashboard">{t("back")}</BackLink>
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        {t("newTitle")}
      </h1>
      <p className="mt-2 text-pretty text-muted-foreground">
        {t("newSubtitleShort")}
      </p>
      <CreateEventForm />
    </PageBody>
  );
}
