"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Clock, Mail, RotateCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { HaloButton } from "@/components/halo/halo-button";
import { HaloInput } from "@/components/halo/halo-input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Turnstile } from "@/components/turnstile";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/lib/i18n/navigation";
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
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "code" | "error">(
    "idle",
  );
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  // Google's page can take a few seconds to open: show it is on its way.
  const [toGoogle, setToGoogle] = useState(false);
  useEffect(() => {
    // Back from Google's page: the browser may restore this page as it was.
    const reset = (e: PageTransitionEvent) => e.persisted && setToGoogle(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  // Sign in with a 6-digit code from the email (DECISIONS #47): the host
  // never leaves this page, and the code can be read on any device.
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
      fetchOptions: {
        headers: {
          "x-captcha-response": captchaToken ?? "",
          "x-locale": locale,
        },
      },
    });
    // Tokens are single-use: get a fresh challenge for a retry or a resend.
    setCaptchaToken(null);
    setCaptchaKey((k) => k + 1);
    if (error) {
      setStatus("error");
      return;
    }
    setCode("");
    setCodeError(null);
    setStatus("code");
  }

  async function verify(value: string) {
    if (value.length !== 6 || verifying) return;
    setVerifying(true);
    setCodeError(null);
    const { error } = await authClient.signIn.emailOtp({ email, otp: value });
    if (error) {
      setVerifying(false);
      setCode("");
      setCodeError(
        error.code === "OTP_EXPIRED" || error.code === "TOO_MANY_ATTEMPTS"
          ? t("codeExpired")
          : t("codeWrong"),
      );
      // The field was disabled while checking: put the cursor back in it.
      requestAnimationFrame(() => codeRef.current?.focus());
      return;
    }
    // The session cookie is set; the next page renders signed in.
    router.replace(callbackPath);
    router.refresh();
  }

  if (status === "code") {
    return (
      <div className="w-full text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent text-primary">
          <Mail className="size-7" aria-hidden />
        </span>
        <h2 className="mt-4 font-heading text-xl font-semibold">
          {t("codeTitle")}
        </h2>
        <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
          {t.rich("codeBody", {
            email,
            b: (chunks) => (
              <span className="font-medium text-foreground">{chunks}</span>
            ),
          })}
        </p>
        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            verify(code);
          }}
        >
          <label htmlFor="sign-in-code" className="sr-only">
            {t("codeLabel")}
          </label>
          <InputOTP
            id="sign-in-code"
            ref={codeRef}
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={(v) => {
              setCode(v);
              if (codeError) setCodeError(null);
            }}
            onComplete={verify}
            disabled={verifying}
            containerClassName="justify-center"
            aria-invalid={codeError ? true : undefined}
            aria-describedby={codeError ? "sign-in-code-error" : undefined}
          >
            <InputOTPGroup className="gap-2 has-aria-invalid:ring-0">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  aria-invalid={codeError ? true : undefined}
                  className="h-14 w-11 rounded-lg border bg-card font-mono text-2xl font-semibold shadow-xs first:rounded-lg last:rounded-lg sm:w-12"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {codeError && (
            <p
              id="sign-in-code-error"
              className="mt-3 text-sm text-destructive"
              role="alert"
            >
              {codeError}
            </p>
          )}
          <HaloButton
            type="submit"
            fullWidth
            size="lg"
            className="mt-5"
            isLoading={verifying}
            loadingText={t("codeVerifying")}
            disabled={code.length !== 6}
          >
            {t("codeSubmit")}
          </HaloButton>
        </form>
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
