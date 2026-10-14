import { getTranslations } from "next-intl/server";
import { LogoMark } from "@/components/brand/logo";

export default async function GuestNotFound() {
  const t = await getTranslations("Guest");
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-5 py-8 text-center">
      <LogoMark className="size-10" />
      <h1 className="font-heading text-2xl font-bold">{t("notFoundTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("notFoundBody")}</p>
    </main>
  );
}
