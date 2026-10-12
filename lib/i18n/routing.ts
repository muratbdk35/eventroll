import { defineRouting } from "next-intl/routing";

// Adding a language = add messages/<code>.json and list it here.
export const locales = ["en", "tr", "de"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});
