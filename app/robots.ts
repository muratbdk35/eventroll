import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/**
 * Search engines see the marketing and legal pages only. Guest pages
 * (/<locale>/e/…), the dashboard, the create flow and the API stay out; guest
 * pages also send noindex themselves.
 */
export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/*/e/", "/*/dashboard", "/*/create", "/*/login"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
