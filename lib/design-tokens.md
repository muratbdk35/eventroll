# Design tokens

Defined as CSS variables in `app/globals.css` and exposed to Tailwind via `@theme`.

| Token         | Role              | Light                              | Dark                                   |
| ------------- | ----------------- | ---------------------------------- | -------------------------------------- |
| `background`  | page ground       | warm cream `oklch(0.985 0.006 75)` | deep warm brown `oklch(0.17 0.012 45)` |
| `primary`     | CTAs, brand       | terracotta `oklch(0.55 0.16 38)`   | light terracotta `oklch(0.74 0.14 45)` |
| `accent`      | chips, highlights | soft peach `oklch(0.93 0.04 60)`   | `oklch(0.3 0.04 45)`                   |
| `success`     | upload done       | green `oklch(0.55 0.13 155)`       | `oklch(0.7 0.13 155)`                  |
| `destructive` | errors, delete    | `oklch(0.55 0.21 25)`              | `oklch(0.68 0.19 25)`                  |
| `radius`      | base radius       | `0.875rem`                         | —                                      |

Fonts: **Geist** (UI, `--font-sans`), **Bricolage Grotesque** (headings, `--font-display`
→ `font-heading`). Both include `latin-ext` for Turkish/German.

Rules: white text on `primary` meets WCAG AA; touch targets ≥ 44px on guest pages;
use logical properties (`ms-*`, `ps-*`, `rtl:`) for future RTL.
