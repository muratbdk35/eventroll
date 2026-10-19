"use client";

import { Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { refundPlan } from "@/lib/events/actions";
import { useRouter } from "@/lib/i18n/navigation";

/**
 * One-click refund while nothing was uploaded and within 14 days of paying
 * (DECISIONS #64). Asks once more before refunding.
 */
export function RefundCard({ eventId }: { eventId: string }) {
  const t = useTranslations("Events.refund");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  function refund() {
    start(async () => {
      const res = await refundPlan(eventId);
      if (res.ok) {
        toast.success(t("done"), { duration: 10_000 });
        router.push(`/dashboard/events/${eventId}`);
        router.refresh();
      } else {
        toast.error(
          res.error === "not_refundable" ? t("notRefundable") : t("failed"),
        );
        setConfirming(false);
      }
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Undo2 className="size-5 text-muted-foreground" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{t("title")}</h2>
          <p className="mt-0.5 text-[13px] text-pretty text-muted-foreground">
            {confirming ? t("confirm") : t("body")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {confirming ? (
              <>
                <Button
                  variant="destructive"
                  className="h-9 rounded-full px-4"
                  disabled={pending}
                  onClick={refund}
                >
                  {t("yes")}
                </Button>
                <Button
                  variant="ghost"
                  className="h-9 rounded-full px-4"
                  disabled={pending}
                  onClick={() => setConfirming(false)}
                >
                  {t("cancel")}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                className="h-9 rounded-full px-4"
                onClick={() => setConfirming(true)}
              >
                {t("button")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
