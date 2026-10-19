import { getTranslations } from "next-intl/server";
import { WithdrawButton } from "@/components/legal/withdraw-button";
import { Link } from "@/lib/i18n/navigation";

/** A slim footer for the dashboard and create flow: legal links and the withdrawal button. */
export async function AppFooter() {
  const t = await getTranslations("Landing.footer");
  const linkCls = "hover:text-foreground";
  return (
    <footer className="mt-10 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {(["terms", "privacy", "withdrawal", "imprint"] as const).map(
            (page) => (
              <Link key={page} href={`/legal/${page}`} className={linkCls}>
                {t(`links.${page}`)}
              </Link>
            ),
          )}
          <Link href="/contact" className={linkCls}>
            {t("links.contact")}
          </Link>
        </nav>
        <WithdrawButton />
      </div>
    </footer>
  );
}
