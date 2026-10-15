"use client";

import { Clock, Loader2, Mail, RotateCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { HaloButton } from "@/components/halo/halo-button";
import { HaloInput } from "@/components/halo/halo-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Turnstile } from "@/components/turnstile";
import { authClient } from "@/lib/auth-client";
import { publicEnv } from "@/lib/public-env";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z"
      />
    </svg>
  );
}

export function LoginForm({
  googleEnabled,
  callbackPath = "/dashboard",
}: {
  googleEnabled: boolean;
  /** Where to land after signing in, without the locale prefix. */
  callbackPath?: string;
}) {
  const t = useTranslations("Login");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "expired" | "error"
  >("idle");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [requestId, setRequestId] = useState<string | null>(null);
  // Google's page can take a few seconds to open: show it is on its way.
  const [toGoogle, setToGoogle] = useState(false);
  useEffect(() => {
    // Back from Google's page: the browser may restore this page as it was.
    const reset = (e: PageTransitionEvent) => e.persisted && setToGoogle(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    // A login request lets this tab continue on its own once the link in the
    // email is opened, on this device or another one (DECISIONS #34).
    const res = await fetch("/api/login-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        next: `/${locale}${callbackPath}`,
        locale,
      }),
    }).catch(() => null);
    const id: string | null = res?.ok ? (await res.json()).id : null;
    if (!id) {
      setStatus("error");
      return;
    }
    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: `/${locale}/auth/confirmed?req=${id}`,
      errorCallbackURL: `/${locale}/auth/confirmed?error=1`,
      metadata: { locale },
      fetchOptions: {
        headers: { "x-captcha-response": captchaToken ?? "" },
      },
    });
    if (error) {
      // Tokens are single-use: get a fresh challenge for the retry.
      setCaptchaToken(null);
      setCaptchaKey((k) => k + 1);
      setStatus("error");
      return;
    }
    setRequestId(id);
    setStatus("sent");
  }

  // Wait for the link to be opened anywhere, then sign this tab in too.
  useEffect(() => {
    if (status !== "sent" || !requestId) return;
    let stop = false;
    const tick = async () => {
      const res = await fetch(`/api/login-request/${requestId}`, {
        cache: "no-store",
      }).catch(() => null);
      if (stop || !res?.ok) return;
      const data = (await res.json()) as { status: string; url?: string };
      if (data.status === "approved" && data.url) {
        stop = true;
        window.location.assign(data.url);
      } else if (data.status === "expired") {
        stop = true;
        setStatus("expired");
      }
    };
    const timer = setInterval(tick, 2500);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [status, requestId]);

  if (status === "sent" || status === "expired") {
    const expired = status === "expired";
    // Layout from the 21st.dev "Auth Verify Email" (preetsuthar17) with the
    // live "waiting for approval" pill of "Push Approval" (felipemenezes098).
    return (
      <div className="w-full text-center" role="status" aria-live="polite">
        <span className="relative mx-auto flex size-16 items-center justify-center rounded-full bg-accent text-primary">
          <Mail className="size-7" aria-hidden />
          {!expired && (
            <span className="absolute -end-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full bg-card shadow ring-1 ring-black/5">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            </span>
          )}
        </span>
        <h2 className="mt-4 font-heading text-xl font-semibold">
          {expired ? t("expiredTitle") : t("sentTitle")}
        </h2>
        <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
          {expired
            ? t("expiredBody")
            : t.rich("sentBody", {
                email,
                b: (chunks) => (
                  <span className="font-medium text-foreground">{chunks}</span>
                ),
              })}
        </p>
        {!expired && (
          <p className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            {t("waiting")}
          </p>
        )}
        {!expired && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-3.5 text-start">
            <Clock
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div>
              <p className="text-sm font-medium">{t("notReceived")}</p>
              <p className="mt-0.5 text-xs text-pretty text-muted-foreground">
                {t("notReceivedHint")}
              </p>
            </div>
          </div>
        )}
        <HaloButton
          tone="secondary"
          fullWidth
          className="mt-4"
          leading={<RotateCw aria-hidden />}
          onClick={() => setStatus("idle")}
        >
          {t("resend")}
        </HaloButton>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <HaloInput
            id="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            leadingSlot={<Mail aria-hidden />}
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {publicEnv.turnstileSiteKey && (
          <Turnstile
            key={captchaKey}
            siteKey={publicEnv.turnstileSiteKey}
            language={locale}
            onToken={setCaptchaToken}
          />
        )}
        <HaloButton
          type="submit"
          fullWidth
          size="lg"
          isLoading={status === "sending"}
          loadingText={t("submitting")}
          disabled={Boolean(publicEnv.turnstileSiteKey) && !captchaToken}
        >
          {t("submit")}
        </HaloButton>
        {status === "error" && (
          <p className="text-sm text-destructive" role="alert">
            {t("error")}
          </p>
        )}
      </form>

      <div className="flex items-center gap-4 py-1">
        <Separator className="flex-1" />
        <span className="text-sm text-muted-foreground">{t("or")}</span>
        <Separator className="flex-1" />
      </div>
      {/* Shown even before the Google keys exist, disabled, so the screen
          already looks like production (keys: GOOGLE_CLIENT_ID/SECRET). */}
      <HaloButton
        tone="secondary"
        fullWidth
        size="lg"
        disabled={!googleEnabled}
        title={googleEnabled ? undefined : "GOOGLE_CLIENT_ID missing"}
        leading={<GoogleIcon />}
        isLoading={toGoogle}
        loadingText={t("toGoogle")}
        onClick={async () => {
          setToGoogle(true);
          const res = await authClient.signIn
            .social({
              provider: "google",
              callbackURL: `/${locale}${callbackPath}`,
            })
            .catch(() => null);
          // On success the browser leaves this page; only failures land here.
          if (!res || res.error) {
            setToGoogle(false);
            setStatus("error");
          }
        }}
      >
        {t("google")}
      </HaloButton>
    </div>
  );
}
