import { getTranslations } from "next-intl/server";
import { HaloButton } from "@/components/halo/halo-button";
import { SiteHeader } from "@/components/site-header";

/** A page that doesn't exist, in the visitor's language. */
export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <p className="font-heading text-7xl font-semibold text-primary/80 tabular-nums">
          404
        </p>
        <h1 className="mt-4 font-heading text-3xl font-bold text-balance">
          {t("title")}
        </h1>
        <p className="mt-2 text-pretty text-muted-foreground">{t("body")}</p>
        <HaloButton href="/" className="mt-7">
          {t("home")}
        </HaloButton>
      </main>
    </>
  );
}
