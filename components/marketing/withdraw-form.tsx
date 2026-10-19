"use client";

import { ArrowLeft, CheckCircle2, FileX2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { HaloButton } from "@/components/halo/halo-button";
import { Turnstile } from "@/components/turnstile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitWithdrawal } from "@/lib/withdraw";

/**
 * The online withdrawal function (§ 356a BGB, DECISIONS #71): the details,
 * then a review step with "Widerruf bestätigen", then the receipt.
 */
export function WithdrawForm({ siteKey }: { siteKey: string | undefined }) {
  const t = useTranslations("Withdraw");
  const locale = useLocale();
  const [form, setForm] = useState({
    name: "",
    orderNo: "",
    email: "",
    website: "",
  });
  const [step, setStep] = useState<"details" | "review">("details");
  const [token, setToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [receivedAt, setReceivedAt] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function confirm() {
    setError(null);
    start(async () => {
      const res = await submitWithdrawal(form, token, locale);
      if (res.ok) {
        setReceivedAt(res.receivedAt);
        return;
      }
      setError(t(`errors.${res.error}`));
      setToken(null);
      setCaptchaKey((k) => k + 1);
    });
  }

  const card =
    "space-y-5 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7";

  if (receivedAt) {
    return (
      <div
        role="status"
        className="flex flex-col items-center rounded-3xl border border-border bg-card p-8 text-center shadow-sm"
      >
        <CheckCircle2 className="size-10 text-success" aria-hidden />
        <h2 className="mt-3 font-heading text-xl font-semibold">
          {t("doneTitle")}
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-pretty text-muted-foreground">
          {t("doneBody", { time: receivedAt, email: form.email })}
        </p>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className={card}>
        <h2 className="font-heading text-lg font-semibold">
          {t("reviewTitle")}
        </h2>
        <blockquote className="rounded-2xl border border-border bg-secondary/40 p-4 text-[15px] leading-relaxed">
          {t("statement", { orderNo: form.orderNo })}
        </blockquote>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">{t("name")}</dt>
          <dd className="break-words">{form.name}</dd>
          <dt className="text-muted-foreground">{t("orderNo")}</dt>
          <dd className="break-words">{form.orderNo}</dd>
          <dt className="text-muted-foreground">{t("email.email")}</dt>
          <dd className="break-words">{form.email}</dd>
        </dl>
        {siteKey && (
          <Turnstile
            key={captchaKey}
            siteKey={siteKey}
            onToken={setToken}
            language={locale}
          />
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <HaloButton
          type="button"
          fullWidth
          isLoading={pending}
          disabled={Boolean(siteKey) && !token}
          onClick={confirm}
          leading={<FileX2 aria-hidden />}
        >
          {t("confirm")}
        </HaloButton>
        <button
          type="button"
          onClick={() => setStep("details")}
          className="mx-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("edit")}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setStep("review");
      }}
      className={card}
    >
      <div className="space-y-1.5">
        <Label htmlFor="w-name">{t("name")}</Label>
        <Input
          id="w-name"
          required
          maxLength={100}
          autoComplete="name"
          value={form.name}
          onChange={set("name")}
          className="h-11 rounded-xl"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="w-order">{t("orderNo")}</Label>
        <Input
          id="w-order"
          required
          maxLength={40}
          value={form.orderNo}
          onChange={set("orderNo")}
          aria-describedby="w-order-hint"
          className="h-11 rounded-xl"
        />
        <p id="w-order-hint" className="text-xs text-muted-foreground">
          {t("orderHint")}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="w-email">{t("emailLabel")}</Label>
        <Input
          id="w-email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          value={form.email}
          onChange={set("email")}
          className="h-11 rounded-xl"
        />
      </div>
      {/* Honeypot: hidden from people and screen readers, bots fill it in. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={form.website}
        onChange={set("website")}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <HaloButton type="submit" fullWidth>
        {t("next")}
      </HaloButton>
      <p className="text-center text-xs text-pretty text-muted-foreground">
        {t("privacy")}
      </p>
    </form>
  );
}
