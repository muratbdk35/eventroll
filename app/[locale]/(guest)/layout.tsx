import { NextIntlClientProvider } from "next-intl";
import { clientMessages } from "@/lib/i18n/client-messages";

/** The guest page: only the guest texts (#67). */
export default async function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider messages={await clientMessages(["Guest"])}>
      {children}
    </NextIntlClientProvider>
  );
}
