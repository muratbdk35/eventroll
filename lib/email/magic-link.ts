import "server-only";
import { render, toPlainText } from "@react-email/components";
import { createTranslator } from "next-intl";
import { env } from "@/lib/env";
import { routing, type Locale } from "@/lib/i18n/routing";
import { sendEmail } from "./send";
import { MagicLinkEmail } from "./templates/magic-link";

function resolveLocale(value: unknown): Locale {
  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : routing.defaultLocale;
}

export async function sendMagicLinkEmail(input: {
  email: string;
  url: string;
  locale: unknown;
}) {
  const locale = resolveLocale(input.locale);
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const t = createTranslator({
    locale,
    messages,
    namespace: "Email.magicLink",
  });
  const appName = env.NEXT_PUBLIC_APP_NAME;
  const copy = {
    preview: t("preview", { appName }),
    heading: t("heading", { appName }),
    body: t("body"),
    button: t("button"),
    ignore: t("ignore"),
  };

  const html = await render(MagicLinkEmail({ appName, url: input.url, copy }));
  await sendEmail({
    to: input.email,
    subject: t("subject", { appName }),
    html,
    text: `${toPlainText(html)}\n\n${input.url}`,
  });
}
