# EventRoll

QR-code event photo sharing: guests scan, upload photos and videos from the phone
browser (no app, no account), hosts get one private gallery.

> Working name; the brand is configurable via `NEXT_PUBLIC_APP_NAME`.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind 4 + shadcn/ui · Drizzle + Neon
Postgres · Better Auth · Cloudflare R2 · Stripe · Resend · next-intl (en/tr/de)
· PostHog · Sentry · Vitest. See `DECISIONS.md` for the reasoning.

## Getting started

Requirements: Node.js ≥ 20.9 (24 recommended).

```bash
npm install
cp .env.example .env.local
```

Minimal `.env.local` for local development (no third-party accounts needed):

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=pglite:./.pglite        # in-process Postgres, dev only
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
BETTER_AUTH_URL=http://localhost:3000
```

```bash
npm run dev
```

Without `RESEND_API_KEY`, sign-in emails are printed to the dev server console;
open the link from there. The Google button appears once `GOOGLE_CLIENT_ID` /
`GOOGLE_CLIENT_SECRET` are set.

### Using Neon

Set `DATABASE_URL` to the Neon pooled connection string, then:

```bash
npm run db:migrate
```

## Scripts

| Script                                | Purpose                                    |
| ------------------------------------- | ------------------------------------------ |
| `npm run dev`                         | dev server                                 |
| `npm run build`                       | production build                           |
| `npm run lint` / `typecheck` / `test` | quality gates (also run in CI)             |
| `npm run db:generate`                 | create a migration from `lib/db/schema.ts` |
| `npm run db:migrate`                  | apply migrations to `DATABASE_URL`         |
| `npm run db:studio`                   | Drizzle Studio                             |

## Project layout

```
app/[locale]/(marketing)   landing, pricing, legal
app/[locale]/(app)         login, dashboard
app/api                    route handlers (auth, guest, events, webhooks, cron)
components                 ui (shadcn), brand, host, guest, marketing
lib                        env, db, auth, email, i18n, analytics
messages                   en.json, tr.json, de.json
drizzle                    SQL migrations
tests/unit                 Vitest
```

## Adding a language

1. Add `messages/<code>.json` (same keys as `en.json`; the unit test enforces it).
2. Add the code to `locales` in `lib/i18n/routing.ts`.
