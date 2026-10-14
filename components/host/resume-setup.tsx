import { ArrowRight, CircleDashed } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import type { PlanId } from "@/lib/plans";

/**
 * A draft event (not paid or not published) sends the host back into the
 * create flow where they left off (DECISIONS #32).
 */
export async function ResumeSetup({
  eventId,
  plan,
}: {
  eventId: string;
  plan: PlanId | null;
}) {
  const t = await getTranslations("Create.resume");
  const href = plan
    ? `/create?step=review&event=${eventId}`
    : `/create?step=plan&event=${eventId}`;
  return (
    <section className="clip-round relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -end-24 -top-28 size-72 rounded-full bg-[radial-gradient(closest-side,oklch(0.57_0.075_240/0.16),transparent)]"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
          <CircleDashed className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-lg font-semibold">
            {plan ? t("titlePublish") : t("titlePlan")}
          </p>
          <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
            {plan ? t("bodyPublish") : t("bodyPlan")}
          </p>
        </div>
        <Button asChild className="h-10 shrink-0 rounded-full px-5">
          <Link href={href}>
            {plan ? t("ctaPublish") : t("ctaPlan")}
            <ArrowRight className="rtl:rotate-180" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
