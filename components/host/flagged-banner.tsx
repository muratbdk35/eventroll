"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { setHideFlagged } from "@/lib/events/actions";
import { cn } from "@/lib/utils";

/**
 * Above the photos when the explicit-image check flagged some (DECISIONS #52,
 * #56). Hidden by default, so a host never has to see them; the switch shows
 * them, blurred, for review, and puts them back into downloads.
 */
export function FlaggedBanner({
  eventId,
  count,
  hidden,
}: {
  eventId: string;
  count: number;
  hidden: boolean;
}) {
  const t = useTranslations("Events.photos");
  const [isHidden, setOptimistic] = useOptimistic(hidden);
  const [pending, start] = useTransition();

  function toggle(hide: boolean) {
    start(async () => {
      setOptimistic(hide);
      const res = await setHideFlagged(eventId, hide);
      if (!res.ok) toast.error(t("hideFailed"));
    });
  }

  const Icon = isHidden ? ShieldCheck : ShieldAlert;
  return (
    <div
      className={cn(
        "mb-4 flex items-center gap-3 rounded-2xl border p-3.5 transition-colors",
        isHidden
          ? "border-border bg-card"
          : "border-amber-500/25 bg-amber-500/8",
      )}
    >
      <Icon
        className={cn(
          "size-5 shrink-0",
          isHidden ? "text-primary" : "text-amber-700",
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {isHidden
            ? t("flaggedHidden", { count })
            : t("flaggedCount", { count })}
        </p>
        <p className="mt-0.5 text-[13px] text-pretty text-muted-foreground">
          {isHidden ? t("flaggedHiddenHint") : t("flaggedCountHint")}
        </p>
      </div>
      <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[13px] font-medium">
        <span>{t("hideFlagged")}</span>
        <Switch
          checked={isHidden}
          disabled={pending}
          onCheckedChange={toggle}
          aria-label={t("hideFlagged")}
        />
      </label>
    </div>
  );
}
