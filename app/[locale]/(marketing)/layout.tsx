import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { clientMessages } from "@/lib/i18n/client-messages";
import type { Locale } from "@/lib/i18n/routing";

/** Landing, legal and contact pages: only their client texts (#67). */
export default async function MarketingLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  // Layouts render in parallel: each sets the locale itself, or next-intl
  // reads it from the request headers and every page here turns dynamic.
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return (
    <NextIntlClientProvider
      messages={await clientMessages([
        "Contact",
        "Withdraw",
        // The landing's mock screens are real app components.
        "Create.steps",
        "Create.details",
        "Create.back",
        "Create.exit",
        "Create.stepOf",
        "Events.share",
        "Events.settings",
        "Events.photos",
        "Events.types",
        "Events.live",
        "Events.copyLink",
        "Events.done",
        "Events.nameLabel",
        "Events.namePlaceholder",
        "Events.startLabel",
        "Events.endLabel",
        "Events.timeLabel",
        "Events.uploadWindowHint",
        "Events.vipLonger",
        "Events.dateRangeError",
      ])}
    >
      {children}
    </NextIntlClientProvider>
  );
}
