import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { SectionHeading } from "./section-heading";

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
    <section className="px-4 py-24">
      <SectionHeading
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <ul className="mx-auto mt-14 grid max-w-6xl grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {types.map(({ key, src }) => (
          <li
            key={key}
            className="group relative aspect-[4/5] overflow-hidden rounded-3xl sm:aspect-[4/3]"
          >
            <Image
              src={src}
              alt={t(`${key}.title`)}
              fill
              sizes="(min-width: 768px) 380px, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
            <div className="absolute inset-x-4 bottom-4 text-white sm:inset-x-5 sm:bottom-5">
              <p className="font-heading text-lg font-bold sm:text-2xl">
                {t(`${key}.title`)}
              </p>
              <p className="mt-0.5 hidden text-sm text-white/80 sm:block">
                {t(`${key}.body`)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
