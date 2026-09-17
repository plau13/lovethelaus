# Roadmap

| Phase | Scope                                                                                                                                                                                                                       | Status            |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 0     | Docs: gap analysis, architecture, ads, heritage, roadmap; template cleanup                                                                                                                                                  | done (2026-09-17) |
| 1     | Stack migration: Neon + Drizzle + Better Auth + Resend + Stripe + R2 cleanup; heritage columns in the baseline schema                                                                                                       | done              |
| 2     | Public pages + SEO + ad slots + consent + privacy update ([`ADS.md`](ADS.md))                                                                                                                                               | done              |
| 3     | Heritage UI ([`HERITAGE.md`](HERITAGE.md)): provenance, scans, voice, family timeline, book structure                                                                                                                       | done              |
| 4     | Table stakes: photo gallery + cover, structured ingredients + unit conversion, pagination + Postgres full-text search, tag filter, favorites page, real offline cook mode, meal plan + grocery list, step timers, PWA icons | after             |

## Phase 2 checklist

- [x] `(public)` route group and layout with the ad grid
- [x] `/r/[slug]` with `generateMetadata` + `Recipe` JSON-LD
- [x] `/c/[slug]` as card index with `ItemList` JSON-LD
- [x] `/explore` and `/explore/[category]` paginated
- [x] `sitemap.ts`, `robots.ts`, root `ads.txt` (pub id placeholder)
- [x] `AdSlot`, `AdSenseScript`, `NEXT_PUBLIC_ADSENSE_CLIENT` (env-gated)
- [ ] AdSense Privacy & messaging enabled (owner, in the AdSense console)
- [x] `privacy.md` advertising section · [ ] `[Company Legal Name]` placeholders filled (owner)
- [x] Security headers (`next.config.ts` `headers()`)
- [x] GA4 on public pages (env-gated)

## Phase 3 checklist

- [x] Person picker + provenance card in the editor
- [x] Provenance block + lineage on the recipe page
- [x] Scan upload → `recipe_media(kind = scan)` beside the typed recipe
- [x] Voice memo record/play → `recipe_media(kind = voice)`, on the recipe page and in cook mode
- [x] "Read this card": Claude vision transcription, applied to an empty recipe as a revision
- [x] Print-ready book at `/cookbooks/[id]/book` (cover, contributors, chapters by occasion)
- [x] Free vs Plus media gating: 1 scan + 1 voice memo per recipe free
- [x] `/family` timeline with `recipe_memory`
- [x] Cookbook dedication + family name (cover and chapters in the printed book)
