/**
 * Legal pages (DECISIONS #68). German (de.ts) is the binding version; en.ts
 * and tr.ts are translations for information. The texts describe what the
 * product actually does; change them together with the code, and have them
 * checked by a lawyer or a legal-text service before launch.
 */
import { docsDe } from "./de";
import { docsEn } from "./en";
import { docsTr } from "./tr";
import {
  legalPages,
  type LegalBlock,
  type LegalCtx,
  type LegalDoc,
  type LegalPage,
} from "./types";

export { legalPages };
export type { LegalBlock, LegalDoc, LegalPage };

/** The seller (imprint, invoices, withdrawal instructions). */
export const SELLER = {
  company: "FeyaTech UG (haftungsbeschränkt)",
  address: "Pestalozzistraße 25, 22305 Hamburg, Deutschland",
  phone: "+49 174 9306097",
  managingDirector: "Feyza Barutcu",
  register: "Amtsgericht Hamburg, HRB 186207",
  taxNumber: "43/720/02102",
} as const;

export function isLegalPage(value: string): value is LegalPage {
  return (legalPages as readonly string[]).includes(value);
}

export type LegalLocale = "de" | "en" | "tr";

const BUILDERS = { de: docsDe, en: docsEn, tr: docsTr };

const pick = (locale: string): LegalLocale =>
  locale in BUILDERS ? (locale as LegalLocale) : "de";

export function getLegalDoc(
  page: LegalPage,
  ctx: { appName: string; supportEmail: string; appUrl?: string },
  locale: string = "de",
): LegalDoc {
  const l = pick(locale);
  const full: LegalCtx = {
    ...SELLER,
    appName: ctx.appName,
    supportEmail: ctx.supportEmail,
    contactUrl: `${ctx.appUrl ?? ""}/${l}/contact`,
  };
  return BUILDERS[l](full)[page];
}

/** A legal page as plain text (order confirmation email, attachment). */
export function legalText(doc: LegalDoc): string {
  const out: string[] = [doc.title, ""];
  if (doc.intro) out.push(doc.intro, "");
  for (const s of doc.sections) {
    out.push(s.heading, "");
    for (const b of s.body) {
      if (typeof b === "string") out.push(b, "");
      else out.push(...b.map((i) => `– ${i}`), "");
    }
  }
  out.push(doc.updated);
  return out.join("\n");
}
