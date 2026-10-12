import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { PhoneGallery } from "./phone-gallery";
import { QrCard } from "./qr-card";

export async function HeroVisual() {
  const t = await getTranslations("Landing.demo");
  return (
    <div className="relative mx-auto flex w-full max-w-[560px] justify-center py-6">
      {/* back photos, as if taken by guests */}
      <figure className="absolute start-0 top-14 hidden w-48 -rotate-[7deg] overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_30px_60px_-25px_rgb(60_30_10/0.55)] sm:block lg:w-52">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
          <Image
            src="/marketing/table-toast.jpg"
            alt=""
            fill
            sizes="210px"
            className="object-cover"
          />
        </div>
        <figcaption className="absolute start-4 bottom-4 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
          {t("photoBy", { name: "Selin", time: "21:42" })}
        </figcaption>
      </figure>
      <figure className="absolute end-0 top-28 hidden w-44 rotate-[6deg] overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_30px_60px_-25px_rgb(60_30_10/0.55)] sm:block lg:w-48">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
          <Image
            src="/marketing/dance-floor.jpg"
            alt=""
            fill
            sizes="200px"
            className="object-cover"
          />
        </div>
      </figure>

      <div className="relative z-10">
        <PhoneGallery />
        {/* live notification */}
        <div className="demo-notify absolute -end-6 top-24 z-20 flex w-56 items-center gap-3 rounded-2xl border border-border/60 bg-card/90 p-3 shadow-xl backdrop-blur-md sm:-end-24">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.75_0.12_50)] to-primary text-sm font-bold text-white">
            M
          </span>
          <div className="min-w-0 text-start">
            <p className="truncate text-[13px] font-semibold">
              {t("notifyTitle", { name: "Mert", count: 12 })}
            </p>
            <p className="text-[11px] text-muted-foreground">{t("now")}</p>
          </div>
        </div>
      </div>

      <QrCard className="absolute -start-2 bottom-0 z-20 hidden -rotate-[5deg] md:block lg:-start-8" />
    </div>
  );
}
