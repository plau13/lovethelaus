# Roadmap

| Phase | Scope                                                                                                                                                                                                                       | Status            |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 0     | Docs: gap analysis, architecture, ads, heritage, roadmap; template cleanup                                                                                                                                                  | done (2026-09-17) |
| 1     | Stack migration: Neon + Drizzle + Better Auth + Resend + Stripe + R2 cleanup; heritage columns in the baseline schema                                                                                                       | in progress       |
| 2     | Public pages + SEO + ad slots + consent + privacy update ([`ADS.md`](ADS.md))                                                                                                                                               | next              |
| 3     | Heritage UI ([`HERITAGE.md`](HERITAGE.md)): provenance, scans, voice, family timeline, book structure                                                                                                                       | next              |
| 4     | Table stakes: photo gallery + cover, structured ingredients + unit conversion, pagination + Postgres full-text search, tag filter, favorites page, real offline cook mode, meal plan + grocery list, step timers, PWA icons | after             |

## Phase 2 checklist

- [ ] `(public)` route group and layout with the ad grid
- [ ] `/r/[slug]` with `generateMetadata` + `Recipe` JSON-LD
- [ ] `/c/[slug]` as card index with `ItemList` JSON-LD
- [ ] `/explore` and `/explore/[category]` paginated
- [ ] `sitemap.ts`, `robots.ts`, root `ads.txt`
- [ ] `AdSlot`, `AdSenseScript`, `NEXT_PUBLIC_ADSENSE_CLIENT`
- [ ] AdSense Privacy & messaging enabled
- [ ] `privacy.md` advertising section, placeholders filled
- [ ] `_headers` security headers
- [ ] GA4 on public pages

## Phase 3 checklist

- [ ] Person picker + provenance card in the editor
- [ ] Provenance block + lineage breadcrumb on the recipe page
- [ ] Scan upload → `recipe_media(kind = scan)` and flip view
- [ ] Voice memo record/play → `recipe_media(kind = voice)`
- [ ] `/family` timeline with `recipe_memory`
- [ ] Cookbook dedication/cover/chapters; public page uses the book structure
