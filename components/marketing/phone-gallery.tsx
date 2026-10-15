import { Check, Send, UserRound } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LogoMark } from "@/components/brand/logo";
import { EventTicket } from "@/components/ui/event-ticket";
import { MockAddMore, MockThumb } from "./mock";

// The guest page at real iPhone proportions (DECISIONS #22, #41): cover with
// the event ticket over it, name field, "add more", the tray and the send bar.

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
  const [t, tg, te] = await Promise.all([
    getTranslations("Landing.demo"),
    getTranslations("Guest"),
    getTranslations("Events"),
  ]);
  return (
    <div
      aria-hidden
      className="relative aspect-[71.5/147.5] w-[252px] shrink-0 rounded-[3rem] bg-[linear-gradient(145deg,#43474d,#1c1816_45%,#33373c)] p-[5px] shadow-[0_60px_100px_-35px_rgb(20_35_60/0.6),0_0_0_1px_rgb(0_0_0/0.25)] sm:w-[272px]"
    >
      {/* side buttons */}
      <span className="absolute -start-[2px] top-[22%] h-8 w-[3px] rounded-s bg-[#23262b]" />
      <span className="absolute -start-[2px] top-[31%] h-12 w-[3px] rounded-s bg-[#23262b]" />
      <span className="absolute -end-[2px] top-[27%] h-16 w-[3px] rounded-e bg-[#23262b]" />

      <div className="relative flex h-full flex-col overflow-hidden rounded-[2.65rem] bg-[oklch(0.975_0.014_244)]">
        <div className="absolute start-1/2 top-[11px] z-20 h-[24px] w-[78px] -translate-x-1/2 rounded-full bg-black rtl:translate-x-1/2" />
        <StatusBar />

        {/* Cover, as on the real guest page */}
        <div className="relative h-[24%] shrink-0">
          <Image
            src="/marketing/couple-ribbons.jpg"
            alt=""
            fill
            priority
            sizes="272px"
            className="object-cover object-[center_30%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/0 to-black/25" />
          <span className="absolute start-4 top-11 flex size-7 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md">
            <LogoMark className="size-4" />
          </span>
        </div>

        {/* Sheet over the cover */}
        <div className="relative -mt-4 flex flex-1 flex-col rounded-t-[1.5rem] bg-[oklch(0.975_0.012_244)] px-3.5 pt-3">
          <div className="relative z-10 -mt-[3.4rem] mb-3">
            <EventTicket
              presenter="EventRoll"
              event={te("types.wedding")}
              name={t("eventName")}
              footer={t("ticketDate")}
              stub={tg("ticketStub")}
              maxWidth={240}
            />
          </div>
          <div className="flex h-8 items-center gap-1.5 rounded-xl border border-[color-mix(in_oklch,var(--border)_70%,oklch(0.86_0.039_242))] bg-white/90 px-3 text-[10px] text-muted-foreground shadow-[0_6px_14px_-10px_rgba(74,112,160,0.4)]">
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
            <MockThumb src="/marketing/toast.jpg">
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
            </MockThumb>
            <MockThumb src="/marketing/rings.jpg" done />
            <MockThumb src="/marketing/dance-floor.jpg" done />
          </div>

          <div className="mt-auto mb-6 rounded-2xl border border-[color-mix(in_oklch,var(--border)_60%,oklch(0.8_0.055_242))] bg-white p-1.5 shadow-[0_10px_24px_-12px_rgba(74,112,160,0.45)]">
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
            <div className="demo-press flex h-8 items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(180deg,oklch(0.63_0.075_240),var(--primary)_55%,oklch(0.52_0.073_239))] text-[11px] font-semibold text-primary-foreground shadow-[0_6px_14px_-6px_var(--primary)]">
              <Send className="size-3" />
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
