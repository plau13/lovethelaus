# Ad revenue strategy — public pages only

Principle: **ads live only where a logged-out visitor lands.** Signed-in users never see ads on any tier. This keeps the marketing promises ("No ads between you and dinner", "Private by default") and makes "ad-free" a non-issue for the paid tier. Revenue comes from making public content worth indexing.

Network: Google AdSense first (no traffic minimum). Slot sizes match the Mediavine / Raptive spec so the switch later is a loader swap (Mediavine ≈ 50k sessions/month, Raptive ≈ 100k pageviews/month).

## Surfaces (Phase 2)

| Surface            | Route                                        | Notes                                                                                                                                                                                                                                                                                        |
| ------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public recipe page | `kitchen/src/app/(public)/r/[slug]/page.tsx` | One recipe per URL from a `public` cookbook. `generateMetadata` (title, description, OG image via the `IMAGES` binding) + `Recipe` JSON-LD (name, image, author, datePublished, recipeIngredient, recipeInstructions, totalTime, recipeYield, keywords). `recipe.slug` exists in the schema. |
| Public cookbook    | `/c/[slug]` (rebuilt)                        | Index of cards (cover, title, time, difficulty) linking to `/r/[slug]`; `ItemList` JSON-LD; `generateMetadata`. Only `public` cookbooks get ads and indexing; `unlisted` stays noindex.                                                                                                      |
| Explore            | `/explore`, `/explore/[category]`            | Paginated grid of public recipes. Crawl entry point.                                                                                                                                                                                                                                         |
| Sitemap / robots   | `kitchen/src/app/sitemap.ts`, `robots.ts`    | Cover `/explore`, `/c/*`, `/r/*` only. Reference from the root `robots.txt`.                                                                                                                                                                                                                 |
| Marketing site     | —                                            | No ads initially; AdSense wants content pages, not a landing page.                                                                                                                                                                                                                           |

## Layout

The app shell is a single `max-w-3xl` column. Public pages get their own route group `kitchen/src/app/(public)/layout.tsx` that does **not** call `getCurrentUser()` and uses a wider grid:

- **Desktop (`lg:` ≥ 1024 px):** `grid-cols-[minmax(0,1fr)_300px]` at `max-w-6xl`. Right rail: sticky `300×600` (`sticky top-24`) and a `300×250` below the fold. Content column stays `max-w-3xl` so recipe typography matches the app.
- **Tablet / mobile:** no rail. One responsive in-content unit between ingredients and instructions, one after instructions, and an anchor unit (`data-ad-format="auto" data-full-width-responsive="true"`) that AdSense renders as a bottom anchor. Never inside the ingredient list.
- **Components:** `components/ads/AdSlot.tsx` (client) renders `<ins class="adsbygoogle">` from `NEXT_PUBLIC_ADSENSE_CLIENT` + a slot map, reserves height per size (`min-h-*`) to avoid CLS, and renders nothing when the env var is unset. `components/ads/AdSenseScript.tsx` loads the script with `next/script` `afterInteractive` in the public layout only.
- **Brand:** ad units sit on paper background inside a `border border-line` frame with a small "Advertisement" label in `text-muted`, so third-party creative never reads as brand content (BRAND.md palette rule).

## Compliance (same phase)

- `public/ads.txt` on the Astro site (must be served at the domain root).
- Consent: Google's built-in CMP (AdSense "Privacy & messaging", GDPR + US state messages). No custom banner code.
- `src/pages/privacy.md`: add an "Advertising and cookies" section (Google AdSense, personalised ads, opt-out links). Fill the `[Company Legal Name]` placeholders.
- Security headers for the public shell in `kitchen/public/_headers` (HSTS, `X-Content-Type-Options`, `Referrer-Policy`). CSP deferred: AdSense and Stripe need a permissive one.
- Cache: public pages use `revalidate = 3600` and on-demand `revalidateTag` from recipe/cookbook save actions; the OpenNext R2 incremental cache already exists.

## Measurement

`NEXT_PUBLIC_GA_ID` gates a GA4 `next/script` in the public layout only (same public-only rule). Track sessions/month and pageviews/month to know when to apply to Mediavine or Raptive.

## Free vs. Plus (for reference)

Free: full private recipe box, story, one scanned card, one voice memo, people and lineage, export of own recipes, 3 lifetime social imports.
Plus ("Kitchen Plus"): unlimited scans/voice, AI transcription of cards, PDF cookbook export, offline cook mode, export of shared recipes, 10 social imports/month.
