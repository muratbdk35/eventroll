import type { Metadata } from "next";
import { Fraunces, Geist_Mono, Schibsted_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { clientMessages } from "@/lib/i18n/client-messages";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ConfirmHost } from "@/components/confirm-dialog";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/lib/i18n/routing";
import { publicEnv } from "@/lib/public-env";
import "../globals.css";

// Type (DECISIONS #40): Fraunces, a soft serif with the feel of printed
// invitations, for headings; Schibsted Grotesk, a sturdy newsroom grotesque,
// for the interface; a mono only where a receipt or a PIN calls for it.
const sans = Schibsted_Grotesk({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});
// Mono only shows on receipts and PINs: not worth a preload on every page.
const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});
const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const appName = publicEnv.appName;
  return {
    metadataBase: new URL(publicEnv.appUrl),
    title: { default: t("title", { appName }), template: `%s · ${appName}` },
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${sans.variable} ${mono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider messages={await clientMessages([])}>
          {children}
          <Toaster />
          <ConfirmHost />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
