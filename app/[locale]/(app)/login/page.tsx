import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LogoMark } from "@/components/brand/logo";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { getSession, googleAuthEnabled } from "@/lib/auth";
import { devLoginEnabled } from "@/lib/dev";
import { Link, redirect } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { publicEnv } from "@/lib/public-env";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Nav");
  return { title: t("login"), robots: { index: false } };
}

export default async function LoginPage({
  params,
}: PageProps<"/[locale]/login">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  if (await getSession()) redirect({ href: "/dashboard", locale });

  const t = await getTranslations("Login");
  const legalLink = "underline underline-offset-2 hover:text-foreground";

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm rounded-3xl px-2 py-8 shadow-sm">
          <CardContent className="flex flex-col items-center gap-7">
            <LogoMark className="size-11" />
            <div className="space-y-2 text-center">
              <h1 className="font-heading text-2xl font-bold text-balance">
                {t("title", { appName: publicEnv.appName })}
              </h1>
              <p className="text-sm text-pretty text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>
            <LoginForm googleEnabled={googleAuthEnabled} />
            {devLoginEnabled && (
              // DEV ONLY: hidden unless running locally on PGlite.
              <a
                href={`/api/dev-login?locale=${locale}`}
                className="rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Dev: continue as demo host
              </a>
            )}
            <p className="text-center text-xs text-pretty text-muted-foreground">
              {t.rich("legal", {
                terms: (chunks) => (
                  <Link href="/legal/terms" className={legalLink}>
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link href="/legal/privacy" className={legalLink}>
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
