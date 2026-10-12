import { ImagePlus, Lock } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

// The guest page mid-event, drawn at real iPhone proportions (≈ 71.5 × 147.5 mm).
// Guests only see their own uploads; the first tile "uploads" on a loop (CSS only).
const mine = [
  "/marketing/toast.jpg",
  "/marketing/cake.jpg",
  "/marketing/dance-floor.jpg",
  "/marketing/rings.jpg",
  "/marketing/sparklers.jpg",
  "/marketing/arch-night.jpg",
  "/marketing/table-toast.jpg",
  "/marketing/confetti.jpg",
  "/marketing/couple-ribbons.jpg",
];

function StatusBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex h-11 items-center justify-between px-6 pt-1 text-[12px] font-semibold text-white">
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <svg viewBox="0 0 18 12" className="h-2.5 w-4 fill-white">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg viewBox="0 0 26 12" className="h-2.5 w-5">
          <rect
            x="0.5"
            y="0.5"
            width="22"
            height="11"
            rx="3"
            fill="none"
            stroke="white"
            strokeOpacity=".5"
          />
          <rect x="2" y="2" width="17" height="8" rx="1.8" fill="white" />
          <rect
            x="23.5"
            y="4"
            width="1.8"
            height="4"
            rx=".9"
            fill="white"
            fillOpacity=".5"
          />
        </svg>
      </span>
    </div>
  );
}

export async function PhoneGallery() {
  const t = await getTranslations("Landing.demo");
  return (
    <div
      aria-hidden
      className="relative aspect-[71.5/147.5] w-[252px] shrink-0 rounded-[3rem] bg-[linear-gradient(145deg,#4a4340,#1c1816_45%,#3a3431)] p-[5px] shadow-[0_60px_100px_-35px_rgb(70_30_10/0.6),0_0_0_1px_rgb(0_0_0/0.25)] sm:w-[272px]"
    >
      {/* side buttons */}
      <span className="absolute -start-[2px] top-[22%] h-8 w-[3px] rounded-s bg-[#2b2522]" />
      <span className="absolute -start-[2px] top-[31%] h-12 w-[3px] rounded-s bg-[#2b2522]" />
      <span className="absolute -end-[2px] top-[27%] h-16 w-[3px] rounded-e bg-[#2b2522]" />

      <div className="relative flex h-full flex-col overflow-hidden rounded-[2.65rem] bg-background">
        <div className="absolute start-1/2 top-[11px] z-20 h-[24px] w-[78px] -translate-x-1/2 rounded-full bg-black rtl:translate-x-1/2" />
        <StatusBar />

        <div className="relative h-[33%] shrink-0">
          <Image
            src="/marketing/couple-ribbons.jpg"
            alt=""
            fill
            priority
            sizes="272px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/30" />
          <div className="absolute inset-x-5 bottom-4 text-white">
            <p className="text-[9.5px] font-semibold tracking-[0.22em] uppercase opacity-80">
              {t("date")}
            </p>
            <p className="mt-0.5 font-heading text-[22px] leading-tight font-bold">
              {t("eventName")}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-4 pt-4">
          <div className="demo-press flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-[13.5px] font-semibold text-primary-foreground shadow-[0_8px_18px_-8px_var(--primary)]">
            <ImagePlus className="size-4" />
            {t("button")}
          </div>

          <div className="mt-3 flex items-baseline justify-between text-[11px]">
            <span className="font-semibold">{t("mine")}</span>
            <span className="text-muted-foreground">
              {t("count", { count: 9 })}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-[3px] overflow-hidden rounded-xl">
            {mine.map((src, i) => (
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
                    <svg viewBox="0 0 36 36" className="size-8 -rotate-90">
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
          </div>

          <p className="mt-auto mb-5 flex items-center justify-center gap-1.5 pt-2 text-[10px] text-muted-foreground">
            <Lock className="size-3" />
            {t("privacy")}
          </p>
        </div>
        {/* home indicator */}
        <span className="absolute start-1/2 bottom-2 h-[4px] w-[34%] -translate-x-1/2 rounded-full bg-foreground/80 rtl:translate-x-1/2" />
      </div>
    </div>
  );
}
