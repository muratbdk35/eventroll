"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { HaloButton } from "@/components/halo/halo-button";
import { Turnstile } from "@/components/turnstile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendContact } from "@/lib/contact";
import { TOPICS, type Topic } from "@/lib/contact-topics";
import { cn } from "@/lib/utils";

/** The contact form (DECISIONS #65). */
export function ContactForm({ siteKey }: { siteKey: string | undefined }) {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "general" as Topic,
    message: "",
    website: "",
  });
  const [token, setToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  const set =
    (k: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await sendContact(form, token);
      if (res.ok) {
        setSent(true);
        return;
      }
      setError(t(`errors.${res.error}`));
      // Turnstile tokens are single-use.
      setToken(null);
      setCaptchaKey((k) => k + 1);
    });
  }

  if (sent) {
    return (
      <div
        role="status"
        className="flex flex-col items-center rounded-3xl border border-border bg-card p-8 text-center shadow-sm"
      >
        <CheckCircle2 className="size-10 text-success" aria-hidden />
        <h2 className="mt-3 font-heading text-xl font-semibold">
          {t("sentTitle")}
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-pretty text-muted-foreground">
          {t("sentBody", { email: form.email })}
        </p>
      </div>
    );
  }

  const field = "space-y-1.5";
  const box =
    "w-full rounded-xl border border-input bg-card px-3 py-2.5 text-[15px] shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className={field}>
          <Label htmlFor="c-name">{t("name")}</Label>
          <Input
            id="c-name"
            required
            maxLength={100}
            autoComplete="name"
            value={form.name}
            onChange={set("name")}
            className="h-11 rounded-xl"
          />
        </div>
        <div className={field}>
          <Label htmlFor="c-email">{t("email")}</Label>
          <Input
            id="c-email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            className="h-11 rounded-xl"
          />
        </div>
      </div>
      <div className={field}>
        <Label htmlFor="c-topic">{t("topic")}</Label>
        <select
          id="c-topic"
          value={form.topic}
          onChange={set("topic")}
          className={cn(box, "h-11 py-0")}
        >
          {TOPICS.map((k) => (
            <option key={k} value={k}>
              {t(`topics.${k}`)}
            </option>
          ))}
        </select>
      </div>
      <div className={field}>
        <Label htmlFor="c-message">{t("message")}</Label>
        <textarea
          id="c-message"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          value={form.message}
          onChange={set("message")}
          className={cn(box, "resize-y")}
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
        type="submit"
        fullWidth
        isLoading={pending}
        disabled={Boolean(siteKey) && !token}
        leading={<Send aria-hidden />}
      >
        {t("send")}
      </HaloButton>
      <p className="text-center text-xs text-pretty text-muted-foreground">
        {t("privacy")}
      </p>
    </form>
  );
}
