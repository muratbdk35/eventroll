import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageBody, PageHeader } from "@/components/host/page-header";
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
  const [t, tDash] = await Promise.all([
    getTranslations("Events"),
    getTranslations("Dashboard"),
  ]);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: tDash("listTitle"), href: "/dashboard" },
          { label: t("newTitle") },
        ]}
      />
      <PageBody className="max-w-2xl">
        <h1 className="text-[22px] font-semibold tracking-tight">
          {t("newTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("newSubtitleShort")}
        </p>
        <CreateEventForm />
      </PageBody>
    </>
  );
}
