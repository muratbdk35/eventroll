# Design tokens

Defined as CSS variables in `app/globals.css` and exposed to Tailwind via `@theme`.

| Token         | Role              | Light                               | Dark                                     |
| ------------- | ----------------- | ----------------------------------- | ---------------------------------------- |
| `background`  | page ground       | warm cream `oklch(0.985 0.006 245)` | deep warm brown `oklch(0.17 0.012 241)`  |
| `primary`     | CTAs, brand       | powder blue `oklch(0.53 0.075 245)` | light powder blue `oklch(0.74 0.06 241)` |
| `accent`      | chips, highlights | pale blue `oklch(0.93 0.022 243)`   | `oklch(0.3 0.022 241)`                   |
| `success`     | upload done       | green `oklch(0.55 0.13 155)`        | `oklch(0.7 0.13 155)`                    |
| `destructive` | errors, delete    | `oklch(0.55 0.21 25)`               | `oklch(0.68 0.19 25)`                    |
| `radius`      | base radius       | `0.875rem`                          | —                                        |

Fonts: **Geist** (UI, `--font-sans`), **Bricolage Grotesque** (headings, `--font-display`
→ `font-heading`). Both include `latin-ext` for Turkish/German.

Rules: white text on `primary` meets WCAG AA; touch targets ≥ 44px on guest pages;
use logical properties (`ms-*`, `ps-*`, `rtl:`) for future RTL.
