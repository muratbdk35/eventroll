import {
  Baby,
  Building2,
  Cake,
  GraduationCap,
  Heart,
  PartyPopper,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SectionHeading } from "./section-heading";

const types = [
  { key: "wedding", icon: Heart },
  { key: "birthday", icon: Cake },
  { key: "corporate", icon: Building2 },
  { key: "babyShower", icon: Baby },
  { key: "graduation", icon: GraduationCap },
  { key: "party", icon: PartyPopper },
] as const;

export async function EventTypes() {
  const t = await getTranslations("Landing.eventTypes");
  return (
    <section className="px-4 py-24">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
      <ul className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3">
        {types.map(({ key, icon: Icon }) => (
          <li
            key={key}
            className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/50"
          >
            <Icon
              className="size-6 text-primary transition-transform group-hover:-rotate-6"
              aria-hidden
            />
            <p className="mt-3 font-heading font-semibold">
              {t(`${key}.title`)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(`${key}.body`)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
