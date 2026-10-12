import { Cake, Gem, GlassWater, Music, type LucideIcon } from "lucide-react";
import { Caveat } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

const hand = Caveat({ subsets: ["latin", "latin-ext"], weight: "600" });

type Shot = {
  icon: LucideIcon;
  tone: string;
  caption: "rings" | "cheers" | "dance" | "cake";
  className: string;
};

// Illustrated "guest photos" (no stock images: original, tiny, and fast).
const shots: Shot[] = [
  {
    icon: Gem,
    tone: "from-[oklch(0.9_0.05_70)] to-[oklch(0.72_0.12_45)]",
    caption: "rings",
    className: "-start-2 top-6 -rotate-[9deg] sm:-start-10",
  },
  {
    icon: GlassWater,
    tone: "from-[oklch(0.88_0.06_150)] to-[oklch(0.62_0.09_175)]",
    caption: "cheers",
    className: "start-0 bottom-0 rotate-[6deg] sm:-start-16 md:hidden",
  },
  {
    icon: Music,
    tone: "from-[oklch(0.86_0.07_300)] to-[oklch(0.58_0.13_310)]",
    caption: "dance",
    className: "-end-2 top-2 rotate-[8deg] sm:-end-12",
  },
  {
    icon: Cake,
    tone: "from-[oklch(0.9_0.06_20)] to-[oklch(0.68_0.15_15)]",
    caption: "cake",
    className: "end-0 bottom-6 -rotate-[7deg] sm:-end-16",
  },
];

export async function PhotoFan({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("Landing.hero.captions");
  return (
    <div className="relative flex justify-center px-14 py-6 sm:px-24">
      {shots.map((s, i) => (
        <figure
          key={s.caption}
          aria-hidden
          className={cn(
            "float-y absolute z-0 w-24 rounded-sm bg-white p-1.5 pb-1 shadow-[0_18px_30px_-14px_rgb(60_30_10/0.45)] sm:w-40 sm:p-2",
            s.className,
          )}
          style={{ animationDelay: `${i * -1.6}s` }}
        >
          <div
            className={cn(
              "flex aspect-square items-center justify-center rounded-[2px] bg-gradient-to-br",
              s.tone,
            )}
          >
            <s.icon className="size-7 text-white/85 sm:size-10" strokeWidth={1.5} />
          </div>
          <figcaption
            className={cn(
              hand.className,
              "py-1 text-center text-sm leading-none text-[oklch(0.35_0.03_40)] sm:text-lg",
            )}
          >
            {t(s.caption)}
          </figcaption>
        </figure>
      ))}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
