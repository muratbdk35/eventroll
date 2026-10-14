import type { Metadata } from "next";
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  MonitorSmartphone,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { approveLoginRequest } from "@/lib/login-requests";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { robots: { index: false } };

/**
 * Where the link in the sign-in email lands (DECISIONS #34). It approves the
 * login request, so the tab that asked for the link continues by itself, and
 * offers to continue here too. Layout from the 21st.dev "Auth Verify Email"
 * card in its verified / expired states.
 */
export default async function ConfirmedPage({
  params,
  searchParams,
}: PageProps<"/[locale]/auth/confirmed">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("Login.confirmed");
  const sp = await searchParams;
  const req = typeof sp.req === "string" ? sp.req : null;

  const session = await getSession();
  const next =
    session && req ? await approveLoginRequest(req, session.user.email) : null;
  const ok = Boolean(session) && !sp.error;
  // Continue where the flow was going, or the dashboard; strip the locale
  // because <Link> adds it again.
  const continuePath = (next ?? `/${locale}/dashboard`).replace(
    new RegExp(`^/${locale}`),
    "",
  );

  return (
    <main className="app-ui relative flex min-h-dvh flex-1 items-center justify-center bg-[oklch(0.975_0.012_70)] px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-64 -left-56 size-[48rem] rounded-full bg-[radial-gradient(closest-side,oklch(0.57_0.175_38/0.13),transparent)]" />
        <div className="absolute -right-64 -bottom-72 size-[52rem] rounded-full bg-[radial-gradient(closest-side,oklch(0.86_0.1_65/0.4),transparent)]" />
      </div>

      <section className="relative w-full max-w-md rounded-3xl border border-border bg-card p-7 text-center shadow-[0_30px_60px_-40px_rgb(60_30_10/0.35)] sm:p-9">
        <LogoMark className="mx-auto size-8" />
        <span
          className={cn(
            "mx-auto mt-6 flex size-16 items-center justify-center rounded-full",
            ok
              ? "bg-success/12 text-success"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {ok ? (
            <CircleCheck className="size-8" aria-hidden />
          ) : (
            <CircleAlert className="size-8" aria-hidden />
          )}
        </span>
        <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight">
          {ok ? t("title") : t("errorTitle")}
        </h1>
        <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
          {ok ? t("body", { email: session!.user.email }) : t("errorBody")}
        </p>

        {ok && next && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-3.5 text-start">
            <MonitorSmartphone
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <p className="text-xs text-pretty text-muted-foreground">
              {t("otherTab")}
            </p>
          </div>
        )}

        <Button
          asChild
          className="mt-6 h-11 w-full rounded-full shadow-[0_10px_24px_-10px_var(--primary)]"
        >
          <Link href={ok ? continuePath : "/login"}>
            {ok ? t("continue") : t("tryAgain")}
            <ArrowRight className="rtl:rotate-180" aria-hidden />
          </Link>
        </Button>
      </section>
    </main>
  );
}
