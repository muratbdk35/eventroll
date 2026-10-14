import { Check, Sparkles, UserRound } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LogoMark } from "@/components/brand/logo";
import { MockAddMore, MockPolaroid } from "./mock";

// The guest page (DECISIONS #26) at real iPhone proportions: cover, name pill,
// pile of prints with the shutter, the tray and the frosted send bar.

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
  const [t, tg] = await Promise.all([
    getTranslations("Landing.demo"),
    getTranslations("Guest"),
  ]);
  return (
    <div
      aria-hidden
      className="relative aspect-[71.5/147.5] w-[252px] shrink-0 rounded-[3rem] bg-[linear-gradient(145deg,#4a4340,#1c1816_45%,#3a3431)] p-[5px] shadow-[0_60px_100px_-35px_rgb(70_30_10/0.6),0_0_0_1px_rgb(0_0_0/0.25)] sm:w-[272px]"
    >
      {/* side buttons */}
      <span className="absolute -start-[2px] top-[22%] h-8 w-[3px] rounded-s bg-[#2b2522]" />
      <span className="absolute -start-[2px] top-[31%] h-12 w-[3px] rounded-s bg-[#2b2522]" />
      <span className="absolute -end-[2px] top-[27%] h-16 w-[3px] rounded-e bg-[#2b2522]" />

      <div className="relative flex h-full flex-col overflow-hidden rounded-[2.65rem] bg-[oklch(0.975_0.014_70)]">
        <div className="absolute start-1/2 top-[11px] z-20 h-[24px] w-[78px] -translate-x-1/2 rounded-full bg-black rtl:translate-x-1/2" />
        <StatusBar />

        {/* Cover, as on the real guest page */}
        <div className="relative h-[29%] shrink-0">
          <Image
            src="/marketing/couple-ribbons.jpg"
            alt=""
            fill
            priority
            sizes="272px"
            className="object-cover object-[center_30%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/0 to-black/70" />
          <span className="absolute start-4 top-11 flex size-7 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md">
            <LogoMark className="size-4" />
          </span>
          <div className="absolute inset-x-4 bottom-6 text-white">
            <p className="text-[8.5px] font-medium tracking-[0.18em] uppercase opacity-85">
              {tg("for")}
            </p>
            <p className="font-heading text-[19px] leading-tight font-bold">
              {t("eventName")}
            </p>
          </div>
        </div>

        {/* Sheet over the cover */}
        <div className="relative -mt-4 flex flex-1 flex-col rounded-t-[1.5rem] bg-[oklch(0.975_0.012_70)] px-3.5 pt-3">
          <div className="flex h-8 items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-3 text-[10px] text-muted-foreground shadow-sm ring-1 ring-black/5">
            <UserRound className="size-3 text-primary" />
            {tg("yourNameOptional")}
          </div>

          <div className="mt-3">
            <MockAddMore label={tg("chooseMore")} />
          </div>
          <p className="mt-4 mb-2 px-1 text-[11px] font-semibold">
            {tg("selected", { count: 3 })}
          </p>

          <div className="grid grid-cols-3 gap-2 px-1">
            <MockPolaroid src="/marketing/toast.jpg" tilt={-2.5}>
              <span className="demo-upload absolute inset-0 flex items-center justify-center bg-black/40">
                <svg viewBox="0 0 36 36" className="size-6 -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="white"
                    strokeOpacity=".3"
                    strokeWidth="3.5"
                  />
                  <circle
                    className="demo-ring"
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="white"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    pathLength="100"
                    strokeDasharray="100"
                  />
                </svg>
              </span>
            </MockPolaroid>
            <MockPolaroid src="/marketing/rings.jpg" tilt={1.5} done />
            <MockPolaroid src="/marketing/dance-floor.jpg" tilt={-1} done />
          </div>

          <div className="mt-auto mb-6 rounded-2xl border border-white/70 bg-white/85 p-1.5 shadow-lg ring-1 shadow-primary/15 ring-black/5">
            <p className="flex items-start gap-1.5 px-1 pt-0.5 pb-2 text-[8.5px] leading-snug text-muted-foreground">
              <span className="mt-px flex size-2.5 shrink-0 items-center justify-center rounded-[3px] bg-primary text-primary-foreground">
                <Check className="size-2" strokeWidth={4} />
              </span>
              <span>
                {tg.rich("consent", {
                  terms: (c) => (
                    <span className="font-medium text-foreground">{c}</span>
                  ),
                  privacy: (c) => (
                    <span className="font-medium text-foreground">{c}</span>
                  ),
                })}
              </span>
            </p>
            <div className="demo-press flex h-8 items-center justify-center gap-1.5 rounded-xl bg-primary text-[11px] font-semibold text-primary-foreground">
              <Sparkles className="size-3.5" />
              {tg("send", { count: 3 })}
            </div>
          </div>
        </div>
        {/* home indicator */}
        <span className="absolute start-1/2 bottom-2 h-[4px] w-[34%] -translate-x-1/2 rounded-full bg-foreground/80 rtl:translate-x-1/2" />
      </div>
    </div>
  );
}
