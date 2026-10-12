import Image from "next/image";
import { getTranslations } from "next-intl/server";

// Full-bleed photo cards in a scroll-snap row (inspired by 21st.dev "Gallery
// with image cards", shadcnblocks). CSS only, no carousel JS.
const types = [
  { key: "wedding", src: "/marketing/arch-night.jpg" },
  { key: "birthday", src: "/marketing/birthday-candles.jpg" },
  { key: "corporate", src: "/marketing/table-toast.jpg" },
  { key: "babyShower", src: "/marketing/baby-balloons.jpg" },
  { key: "graduation", src: "/marketing/graduation.jpg" },
  { key: "party", src: "/marketing/confetti.jpg" },
] as const;

export async function EventTypes() {
  const t = await getTranslations("Landing.eventTypes");
  return (
    <section className="py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-primary">{t("eyebrow")}</p>
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            {t("title")}
          </h2>
        </div>
        <p className="max-w-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <ul className="mt-12 flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto px-4 pb-4 md:px-[max(1rem,calc((100vw-72rem)/2+1rem))] [&::-webkit-scrollbar]:hidden">
        {types.map(({ key, src }) => (
          <li
            key={key}
            className="group relative aspect-[3/4] w-[78vw] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-3xl sm:w-[280px]"
          >
            <Image
              src={src}
              alt={t(`${key}.title`)}
              fill
              sizes="300px"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute inset-x-5 bottom-5 text-white">
              <p className="font-heading text-2xl font-bold">
                {t(`${key}.title`)}
              </p>
              <p className="mt-1 text-sm text-white/80">{t(`${key}.body`)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
