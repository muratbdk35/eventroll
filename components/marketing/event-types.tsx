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
      <SectionHeading title={t("title")} subtitle={t("subtitle")} />
      {/* Prints laid out on a table: white border, caption under the photo. */}
      <ul className="mx-auto mt-14 grid max-w-6xl grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3">
        {types.map(({ key, src }, i) => (
          <li
            key={key}
            className="rounded-[5px] bg-white p-2 pb-4 shadow-[0_1px_2px_rgb(20_35_60/0.08),0_14px_30px_-18px_rgb(20_35_60/0.35)] ring-1 ring-foreground/5 sm:p-3 sm:pb-5"
            style={{ rotate: `${[-1.2, 0.8, -0.5, 1, -0.8, 0.6][i]}deg` }}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-muted sm:aspect-[4/3]">
              <Image
                src={src}
                alt={t(`${key}.title`)}
                fill
                sizes="(min-width: 768px) 380px, 50vw"
                className="object-cover"
              />
            </div>
            <p className="mt-3 font-heading text-lg leading-tight font-semibold sm:text-xl">
              {t(`${key}.title`)}
            </p>
            <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
              {t(`${key}.body`)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
