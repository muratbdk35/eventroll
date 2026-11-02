"use client";

import { track } from "@vercel/analytics";
import { useEffect } from "react";

/*
 * Where landing visitors drop off (DECISIONS #85): which sections they reach
 * and which buttons they press, as Vercel Analytics custom events. Nothing
 * about the visitor is sent; each section counts once per page view.
 */
const SECTIONS = [
  "how-it-works",
  "features",
  "pricing",
  "faq",
  "page-end",
] as const;

export function LandingTracker() {
  useEffect(() => {
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.id;
          if (!e.isIntersecting || seen.has(id)) continue;
          seen.add(id);
          track("Section viewed", { section: id });
          observer.unobserve(e.target);
        }
      },
      { threshold: 0.25 },
    );
    for (const id of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    // One listener for every button on the page; `data-track` on the
    // nearest section says where the click came from.
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest("a");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      const from =
        link.closest("[data-track]")?.getAttribute("data-track") ?? "page";
      if (href.includes("/create")) track("Create clicked", { from });
      else if (href.includes("/login")) track("Login clicked", { from });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  // The end of the page, below the FAQ and the final call to action.
  return <div id="page-end" aria-hidden className="h-px" />;
}
