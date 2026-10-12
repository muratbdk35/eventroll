import { ImagePlus } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

// The guest page as it looks mid-event: cover, upload button and the shared
// album filling up. The first tile "uploads" on a loop (CSS only).
const grid = [
  "/marketing/toast.jpg",
  "/marketing/cake.jpg",
  "/marketing/dance-floor.jpg",
  "/marketing/rings.jpg",
  "/marketing/sparklers.jpg",
  "/marketing/arch-night.jpg",
  "/marketing/table-toast.jpg",
  "/marketing/confetti.jpg",
];

export async function PhoneGallery() {
  const t = await getTranslations("Landing.demo");
  return (
    <div
      aria-hidden
      className="relative w-[250px] shrink-0 rounded-[2.75rem] bg-[oklch(0.22_0.015_40)] p-[7px] shadow-[0_50px_100px_-30px_rgb(70_30_10/0.6),inset_0_0_0_1.5px_rgb(255_255_255/0.08)] sm:w-[280px]"
    >
      <div className="absolute start-1/2 top-[15px] z-20 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-black rtl:translate-x-1/2" />
      <div className="relative overflow-hidden rounded-[2.3rem] bg-background">
        <div className="relative h-40">
          <Image
            src="/marketing/couple-ribbons.jpg"
            alt=""
            fill
            priority
            sizes="280px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-4 bottom-3 text-white">
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase opacity-85">
              {t("date")}
            </p>
            <p className="font-heading text-xl leading-tight font-bold">
              {t("eventName")}
            </p>
          </div>
        </div>

        <div className="space-y-3 p-3">
          <div className="demo-press flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-semibold text-primary-foreground shadow-[0_8px_18px_-8px_var(--primary)]">
            <ImagePlus className="size-4" />
            {t("button")}
          </div>
          <div className="flex items-center justify-between px-0.5 text-[11px]">
            <span className="font-semibold">{t("album")}</span>
            <span className="text-muted-foreground">
              {t("count", { count: 142 })}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-lg">
            {grid.map((src, i) => (
              <div
                key={src}
                className="relative aspect-square overflow-hidden bg-muted"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="90px"
                  quality={60}
                  className="object-cover"
                />
                {i === 0 && (
                  <div className="demo-upload absolute inset-0 flex items-center justify-center bg-black/45">
                    <svg viewBox="0 0 36 36" className="size-9 -rotate-90">
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="white"
                        strokeOpacity=".3"
                        strokeWidth="3"
                      />
                      <circle
                        className="demo-ring"
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        pathLength="100"
                        strokeDasharray="100"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            <div className="flex aspect-square items-center justify-center bg-muted text-[11px] font-semibold text-muted-foreground">
              +134
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
