"use client";

import { CirclePause, CirclePlay } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { setUploadsPaused } from "@/lib/events/actions";
import { cn } from "@/lib/utils";

/**
 * Top of the settings: stops guest uploads at once and reopens them (#78).
 * Works on its own, without the form's save button.
 */
export function UploadPause({
  eventId,
  paused,
}: {
  eventId: string;
  paused: boolean;
}) {
  const t = useTranslations("Events.settings");
  const [isPaused, setOptimistic] = useOptimistic(paused);
  const [pending, start] = useTransition();

  function toggle(next: boolean) {
    start(async () => {
      setOptimistic(next);
      const res = await setUploadsPaused(eventId, next);
      if (res.ok) toast.success(next ? t("pausedOn") : t("pausedOff"));
      else toast.error(t("error"));
    });
  }

  const Icon = isPaused ? CirclePause : CirclePlay;
  return (
    <label
      htmlFor="upload-pause"
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-2xl border p-4 shadow-xs transition-colors sm:px-5",
        isPaused
          ? "border-amber-500/30 bg-amber-500/8"
          : "border-border bg-card",
      )}
    >
      <Icon
        className={cn(
          "size-6 shrink-0",
          isPaused ? "text-amber-700" : "text-primary",
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{t("pause")}</span>
        <span className="mt-0.5 block text-[13px] text-pretty text-muted-foreground">
          {isPaused ? t("pauseOnHint") : t("pauseOffHint")}
        </span>
      </span>
      <Switch
        id="upload-pause"
        checked={isPaused}
        disabled={pending}
        onCheckedChange={toggle}
      />
    </label>
  );
}
