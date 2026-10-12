import { getTranslations } from "next-intl/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "./section-heading";

const keys = [
  "app",
  "how",
  "payment",
  "quality",
  "duration",
  "privacy",
  "misuse",
  "guests",
  "limits",
] as const;

export async function Faq() {
  const t = await getTranslations("Landing.faq");
  const items = keys.map((k) => ({
    k,
    q: t(`items.${k}.q`),
    a: t(`items.${k}.a`),
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <section id="faq" className="scroll-mt-20 px-4 py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
      <Accordion
        type="single"
        collapsible
        className="mx-auto mt-12 max-w-3xl rounded-3xl border border-border bg-card px-6"
      >
        {items.map(({ k, q, a }) => (
          <AccordionItem key={k} value={k}>
            <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline">
              {q}
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-base text-pretty text-muted-foreground">
              {a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
