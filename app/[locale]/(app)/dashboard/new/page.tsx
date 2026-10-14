import { redirect } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

/** Old entry point; the create flow lives at /create (DECISIONS #32). */
export default async function NewEventPage({
  params,
}: PageProps<"/[locale]/dashboard/new">) {
  const locale = (await params).locale as Locale;
  redirect({ href: "/create", locale });
}
