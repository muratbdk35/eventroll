import { NextIntlClientProvider } from "next-intl";
import { clientMessages } from "@/lib/i18n/client-messages";

/** Dashboard, create flow and sign-in (#67). */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider
      messages={await clientMessages([
        "Events",
        "Create",
        "Login",
        "Guest",
        "Dashboard",
        "Landing.pricing",
      ])}
    >
      {children}
    </NextIntlClientProvider>
  );
}
