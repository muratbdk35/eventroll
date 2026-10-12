# Decisions

Log of choices made where the spec was ambiguous or where reality differed.
Newest at the bottom. "Open" items need a human decision before launch.

## 1. Framework versions (2026-10-12)

Next.js 16.4 / React 19.3 / Zod 4 / next-intl 4 / Better Auth 1.7 / Drizzle 0.45.
Next 16 renamed Middleware to **Proxy** (`proxy.ts`). Version-matched Next docs
live in `node_modules/next/dist/docs/`.

## 2. Legal entity: Germany, payments via Stripe directly (2026-10-12)

The seller is a German company, so Stripe is used directly (no merchant of record).

- **Tax:** Stripe Tax (flag `STRIPE_TAX_ENABLED`), EU B2C VAT via **OSS**.
  Non-EU registrations are monitored via Stripe Tax threshold alerts. _Open:_ OSS
  registration with BZSt (human / tax advisor).
- **Prices are tax-inclusive** (`tax_behavior: inclusive`) to satisfy PAngV.
- **Withdrawal right (Widerrufsrecht):** checkout must collect explicit consent to
  immediate performance and acknowledgement of losing the 14-day withdrawal right;
  stored in `orders.withdrawal_waiver_at`. The voluntary 14-day money-back
  guarantee sits on top of this.
- **Invoices:** Stripe Checkout `invoice_creation` enabled.
- **B2B:** optional VAT ID collection at checkout (reverse charge).
- **Impressum:** `/legal/imprint` page is required (added in phase 1D, DRAFT).
- Payment code stays behind `lib/payments.ts` so the provider can be swapped.

## 3. Cache Components disabled for the MVP

Next 16 scaffolds with `cacheComponents: true`. Almost every app route reads the
session or per-request data, so it would add Suspense boundaries everywhere for
little gain. Marketing pages are still statically prerendered via
`generateStaticParams`. Can be revisited later without data-model changes.

## 4. Database drivers

- Production: Neon via the **WebSocket** driver (`drizzle-orm/neon-serverless`),
  because upload counters are updated in interactive transactions (spec §7.3);
  `neon-http` doesn't support those.
- **Local dev/tests: PGlite** (`DATABASE_URL=pglite:./.pglite`), in-process
  Postgres, migrations applied automatically on first use. Rejected in production by
  `lib/env.ts`. During `next build` an in-memory instance is used.
- Drizzle `casing: "snake_case"`: TS keys are camelCase, columns snake_case.
  Better Auth tables follow the same rule.

## 5. Event status `suspended`

Added to the spec's `draft | active | expired | deleted` so admins can take an
event down (spec §7.6) without deleting evidence.

## 6. Theming

Dark/light follows `prefers-color-scheme` only (no toggle, zero JS), so the guest
page stays light. Tokens in `app/globals.css`, documented in `lib/design-tokens.md`.

## 7. Retention start for paid plans

`expires_at = max(paid_at, event_date) + retention` so buying early doesn't eat
into the gallery lifetime. (Spec said `paid_at + retention`.) Free plan unchanged:
`max(event_date, created_at) + 7 days`.

## 8. Upload limits that the server can't verify

- R2 has no S3 POST-policy (`content-length-range`); size is bound by signing
  `Content-Length` on the presigned PUT and re-checked with HEAD in `confirm`.
- Video **duration** limits (2/5 min) are enforced client-side from metadata only;
  the server enforces byte limits.

## 9. "Remove branding" (Premium) in the MVP

Means hiding the "Powered by" line on guest pages and printed templates. Full
brand customization stays in phase 2.

## 10. Turnstile on owner sign-up

Moved to phase 1B so the widget, server verification and guest session are built
together (Better Auth `captcha` plugin).

## 11. UI sourcing (21st.dev)

21st.dev Magic MCP is used for marketing and dashboard layouts only, always adapted
to our tokens and copy (spec §0.7: original brand). The guest page is hand-written
with plain Tailwind to keep JS minimal. Free tier = 2 component fetches/day.

## 12. Analytics & monitoring defaults

PostHog EU Cloud, lazily loaded, in-memory persistence (no cookies) until the
cookie-consent banner exists (phase 1D). Sentry is a no-op until a DSN is set.
Hosting region: Frankfurt (Neon `eu-central-1`, Vercel `fra1`).

## 13. Open: abuse / CSAM escalation procedure

To be written in phase 1D: Cloudflare CSAM Scanning Tool on the R2 custom domain,
admin one-click delete + suspend, audit log, reporting to the relevant authority
(in Germany: BKA / jugendschutz.net). _Open:_ human sign-off.

## 14. Landing page built ahead of phase 1D (2026-10-12)
At the owner's request the full landing page was built now, using 21st.dev for
inspiration (previews of hero, steps, bento, gallery and pricing blocks) and one
fetched component ("Receipt Tiers"), rewritten as a server component with CSS-only
motion. No testimonials section until there are real customers (no invented
reviews). Guest "photos" in the hero are illustrated gradients, not stock images.
SEO pages, legal pages and cookie consent remain in phase 1D.

## 15. Prices: Standard $29, Premium $49 (owner decision, 2026-10-12)
Replaces the spec's $19 / $39. The pricing section shows only the two paid plans;
the free plan stays as a trial strip below them (signup without a card is still the
main acquisition path). Premium is the featured plan ("Best value", shown first on
mobile). Limits are unchanged; all values live in `lib/plans.ts`.
Hero imagery now uses real Unsplash-licensed photos (see `public/marketing/CREDITS.md`).
