import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { routing } from "@/lib/i18n/routing";
import { legalPages } from "@/lib/legal/content";

/** The public pages in every language, each listing its translations. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const paths = [
    "",
    "/contact",
    "/withdraw",
    ...legalPages.map((p) => `/legal/${p}`),
    "/legal/third-party",
  ];
  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${base}/${locale}${path}`,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.4,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${base}/${l}${path}`]),
        ),
      },
    })),
  );
}
