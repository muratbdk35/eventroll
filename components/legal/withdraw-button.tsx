import { FileX2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * "Vertrag widerrufen" (§ 356a BGB, DECISIONS #71): on every page where a
 * contract can be made, set apart from the plain legal links.
 */
export async function WithdrawButton({ className }: { className?: string }) {
  const t = await getTranslations("Withdraw");
  return (
    <Link
      href="/withdraw"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-foreground/25 bg-card px-3.5 py-1.5 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-secondary",
        className,
      )}
    >
      <FileX2 className="size-4" aria-hidden />
      {t("button")}
    </Link>
  );
}
