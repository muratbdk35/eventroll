"use client";

import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { LoginForm } from "../login/login-form";
import { StepFooter, StepHeading } from "./create-flow";
import { type FlowProps, flowHref } from "./flow";

// Layout from the 21st.dev "Sign Up 2" (meschacirung, Tailark Veil): a calm
// card with the email field, "or", then "Continue with Google".

/** Step 3: an account, so the event can be saved and paid for. */
export function AccountStep({ plan, googleEnabled, devLogin }: FlowProps) {
  const t = useTranslations("Create");
  const tl = useTranslations("Login");
  const locale = useLocale();
  const after = flowHref("pay", { plan });
  const legalLink = "underline underline-offset-2 hover:text-foreground";

  return (
    <div>
      <StepHeading
        title={t("account.title")}
        subtitle={t("account.subtitle")}
      />
      <div className="mx-auto max-w-sm rounded-3xl border border-border bg-[oklch(0.97_0.008_70)] p-6 sm:p-8">
        <LoginForm googleEnabled={googleEnabled} callbackPath={after} />
        {devLogin && (
          // DEV ONLY: hidden unless running locally.
          <a
            href={`/api/dev-login?locale=${locale}&next=${encodeURIComponent(`/${locale}${after}`)}`}
            className="mt-4 block rounded-lg border border-dashed border-border px-3 py-2 text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Dev: continue as demo host
          </a>
        )}
        <p className="mt-5 flex items-start gap-2 text-xs text-pretty text-muted-foreground">
          <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden />
          {t("account.saved")}
        </p>
      </div>
      <p className="mx-auto mt-5 max-w-sm text-center text-xs text-pretty text-muted-foreground">
        {tl.rich("legal", {
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

      <StepFooter
        back={
          <Button asChild variant="ghost" className="h-10 rounded-full px-4">
            <Link href={flowHref("plan", { plan })}>
              <ArrowLeft className="rtl:rotate-180" aria-hidden />
              {t("back")}
            </Link>
          </Button>
        }
      />
    </div>
  );
}
