"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/** Re-renders the server page so newly uploaded photos show up. */
export function RefreshButton({ className }: { className?: string }) {
  const t = useTranslations("Events.photos");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => start(() => router.refresh())}
      disabled={pending}
      aria-label={t("refresh")}
      title={t("refresh")}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-xs transition-all outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-90 disabled:opacity-70",
        className,
      )}
    >
      <RefreshCw
        className={cn("size-4", pending && "animate-spin")}
        aria-hidden
      />
    </button>
  );
}
