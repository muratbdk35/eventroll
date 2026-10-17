"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { HaloButton } from "@/components/halo/halo-button";
import { LogoMark } from "@/components/brand/logo";

/** Something broke while rendering: say so plainly and offer a retry. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorPage");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 py-16 text-center">
      <LogoMark className="size-10" />
      <h1 className="mt-5 font-heading text-2xl font-bold text-balance">
        {t("title")}
      </h1>
      <p className="mt-2 text-pretty text-muted-foreground">{t("body")}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <HaloButton onClick={reset}>{t("retry")}</HaloButton>
        <HaloButton tone="secondary" href="/">
          {t("home")}
        </HaloButton>
      </div>
      {error.digest && (
        <p className="mt-6 font-mono text-xs text-muted-foreground">
          {error.digest}
        </p>
      )}
    </main>
  );
}
