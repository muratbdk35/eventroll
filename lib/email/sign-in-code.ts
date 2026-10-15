import "server-only";
import { render, toPlainText } from "@react-email/components";
import { createTranslator } from "next-intl";
import { env } from "@/lib/env";
import { routing, type Locale } from "@/lib/i18n/routing";
import { sendEmail } from "./send";
import { SignInCodeEmail } from "./templates/sign-in-code";

function resolveLocale(value: unknown): Locale {
  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : routing.defaultLocale;
}

/**
 * The 6-digit sign-in code (DECISIONS #47). The code is in the subject too,
 * so it shows in the phone's notification without opening the email, and
 * Safari can offer it in the code field.
 */
export async function sendSignInCodeEmail(input: {
  email: string;
  code: string;
  locale: unknown;
}) {
  const locale = resolveLocale(input.locale);
  if (process.env.NODE_ENV === "development") {
    // DEV ONLY: the local Resend key can only send, so tests read the code here.
    console.info(`[dev-email] sign-in code for ${input.email}: ${input.code}`);
  }
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const t = createTranslator({
    locale,
    messages,
    namespace: "Email.signInCode",
  });
  const appName = env.NEXT_PUBLIC_APP_NAME;

  const html = await render(
    SignInCodeEmail({
      locale,
      appName,
      appUrl: env.NEXT_PUBLIC_APP_URL,
      code: input.code,
      copy: {
        preview: t("preview", { code: input.code }),
        heading: t("heading"),
        body: t("body", { appName }),
        codeLabel: t("codeLabel"),
        validity: t("validity"),
        ignore: t("ignore"),
        footer: t("footer"),
      },
    }),
  );
  await sendEmail({
    to: input.email,
    subject: t("subject", { appName, code: input.code }),
    html,
    text: toPlainText(html),
  });
}
