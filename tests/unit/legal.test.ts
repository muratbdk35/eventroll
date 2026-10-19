import { describe, expect, it } from "vitest";
import {
  getLegalDoc,
  legalPages,
  legalText,
  SELLER,
} from "@/lib/legal/content";

const ctx = {
  appName: "EventRoll",
  supportEmail: "hello@eventroll.eu",
  appUrl: "https://eventroll.eu",
};

describe("legal pages", () => {
  it("exist in German and English with the same sections", () => {
    for (const page of legalPages) {
      const de = getLegalDoc(page, ctx, "de");
      const en = getLegalDoc(page, ctx, "en");
      expect(en.sections.length, page).toBe(de.sections.length);
    }
  });

  it("have no unfilled placeholders left", () => {
    for (const page of legalPages)
      for (const l of ["de", "en"]) {
        const text = legalText(getLegalDoc(page, ctx, l));
        expect(text, `${page} ${l}`).not.toMatch(/\[(?!\*)[^\]]*\]/);
        expect(text).not.toMatch(/Lawyer:/);
      }
  });

  it("name the seller and how to withdraw", () => {
    const w = legalText(getLegalDoc("withdrawal", ctx, "de"));
    expect(w).toContain(SELLER.company);
    expect(w).toContain("hello@eventroll.eu");
    expect(w).toContain("Muster-Widerrufsformular");
    const imprint = legalText(getLegalDoc("imprint", ctx, "de"));
    expect(imprint).toContain(SELLER.register);
    expect(imprint).toContain("https://eventroll.eu/de/contact");
  });

  it("shows Turkish visitors the English text", () => {
    expect(getLegalDoc("terms", ctx, "tr").title).toBe(
      getLegalDoc("terms", ctx, "en").title,
    );
  });

  it("falls back to German for other locales", () => {
    expect(getLegalDoc("terms", ctx, "fr").title).toBe(
      getLegalDoc("terms", ctx, "de").title,
    );
  });
});
