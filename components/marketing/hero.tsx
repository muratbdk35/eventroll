import { ArrowRight, Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { HeroVisual } from "./hero-visual";

export async function Hero() {
  const t = await getTranslations("Landing.hero");
  const points = [t("point1"), t("point2"), t("point3")];

  return (
    <section className="relative overflow-hidden">
      {/* warm glow, inspired by 21st.dev "Gradient Hero" */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_50%_at_70%_55%,oklch(0.86_0.09_55/0.55),transparent_75%)] dark:bg-[radial-gradient(55%_50%_at_70%_55%,oklch(0.42_0.11_40/0.35),transparent_75%)]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
        <div className="text-center lg:text-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-sm text-muted-foreground shadow-sm">
            <span className="size-2 rounded-full bg-primary" />
            {t("eyebrow")}
          </span>
          <h1 className="mt-6 font-heading text-5xl leading-[1.02] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            {t("line1")}{" "}
            <span className="relative whitespace-nowrap text-primary">
              {t("line2")}
              <svg
                aria-hidden
                viewBox="0 0 220 18"
                className="absolute start-0 -bottom-2 h-3 w-full text-primary/45"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 13C50 4 120 2 218 9"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-pretty text-muted-foreground lg:mx-0">
            {t("subhead")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-xl px-6 text-base shadow-[0_10px_24px_-10px_var(--primary)] sm:w-auto"
            >
              <Link href="/login">
                {t("cta")}
                <ArrowRight className="rtl:rotate-180" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-12 w-full rounded-xl px-5 text-base sm:w-auto"
            >
              <a href="#how-it-works">{t("secondary")}</a>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
            {points.map((p) => (
              <li key={p} className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-success" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
