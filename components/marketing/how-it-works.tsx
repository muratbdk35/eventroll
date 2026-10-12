import { CalendarPlus, Images, QrCode } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SectionHeading } from "./section-heading";

// Numbered-steps layout inspired by 21st.dev "How It Works Steps" (ln-dev7).
const steps = [
  { key: "create", icon: CalendarPlus },
  { key: "share", icon: QrCode },
  { key: "collect", icon: Images },
] as const;

export async function HowItWorks() {
  const t = await getTranslations("Landing.steps");
  return (
    <section id="how-it-works" className="scroll-mt-20 px-4 py-24">
      <SectionHeading
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <ol className="relative mx-auto mt-16 grid max-w-5xl gap-12 md:grid-cols-3 md:gap-8">
        <span
          aria-hidden
          className="absolute inset-x-[16%] top-7 hidden border-t-2 border-dashed border-border md:block"
        />
        {steps.map(({ key, icon: Icon }, i) => (
          <li
            key={key}
            className="relative flex flex-col items-center text-center"
          >
            <span className="relative flex size-14 items-center justify-center rounded-full border-2 border-primary/30 bg-background font-heading text-lg font-bold text-primary shadow-sm">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="mt-6 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Icon className="size-6" aria-hidden />
            </div>
            <h3 className="mt-4 font-heading text-xl font-semibold">
              {t(`${key}.title`)}
            </h3>
            <p className="mt-2 max-w-xs text-pretty text-muted-foreground">
              {t(`${key}.body`)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
