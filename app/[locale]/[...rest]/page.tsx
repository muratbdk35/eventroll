import { notFound } from "next/navigation";

// Any unknown path under a locale renders the localised 404 below
// (app/[locale]/not-found.tsx) instead of Next's built-in English page.
export default function CatchAll() {
  notFound();
}
