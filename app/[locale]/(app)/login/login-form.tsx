"use client";

import { Loader2, MailCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";

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

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const t = useTranslations("Login");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const callbackURL = `/${locale}/dashboard`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL,
      metadata: { locale },
    });
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <div
        className="flex flex-col items-center gap-3 text-center"
        role="status"
      >
        <MailCheck className="size-10 text-primary" aria-hidden />
        <h2 className="font-heading text-xl font-semibold">{t("sentTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("sentBody", { email })}
        </p>
        <Button variant="link" onClick={() => setStatus("idle")}>
          {t("useDifferentEmail")}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-11 w-full rounded-xl"
          disabled={status === "sending"}
        >
          {status === "sending" ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              {t("submitting")}
            </>
          ) : (
            t("submit")
          )}
        </Button>
        {status === "error" && (
          <p className="text-sm text-destructive" role="alert">
            {t("error")}
          </p>
        )}
      </form>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-4 py-1">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">{t("or")}</span>
            <Separator className="flex-1" />
          </div>
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full rounded-xl"
            onClick={() =>
              authClient.signIn.social({ provider: "google", callbackURL })
            }
          >
            <GoogleIcon />
            {t("google")}
          </Button>
        </>
      )}
    </div>
  );
}
