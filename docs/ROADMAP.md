# Roadmap

| Phase | Scope                                                                                                                                                                                                                       | Status            |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 0     | Docs: gap analysis, architecture, ads, heritage, roadmap; template cleanup                                                                                                                                                  | done (2026-09-17) |
| 1     | Stack migration: Neon + Drizzle + Better Auth + Resend + Stripe + R2 cleanup; heritage columns in the baseline schema                                                                                                       | done              |
| 2     | Public pages + SEO + ad slots + consent + privacy update ([`ADS.md`](ADS.md))                                                                                                                                               | done              |
| 3     | Heritage UI ([`HERITAGE.md`](HERITAGE.md)): provenance, scans, voice, family timeline, book structure                                                                                                                       | done              |
| 4     | Table stakes: photo gallery + cover, structured ingredients + unit conversion, pagination + Postgres full-text search, tag filter, favorites page, real offline cook mode, meal plan + grocery list, step timers, PWA icons | in progress       |
| 5     | Launch: deploy runbook, Database + Smoke workflows, legal pages, observability, onboarding that configures something                                                                                                        | done (2026-09-21) |

## Phase 2 checklist

- [x] `(public)` route group and layout with the ad grid
- [x] `/r/[slug]` with `generateMetadata` + `Recipe` JSON-LD
- [x] `/c/[slug]` as card index with `ItemList` JSON-LD
- [x] `/explore` and `/explore/[category]` paginated
- [x] `sitemap.ts`, `robots.ts`, root `ads.txt` (pub id placeholder)
- [x] `AdSlot`, `AdSenseScript`, `NEXT_PUBLIC_ADSENSE_CLIENT` (env-gated)
- [ ] AdSense Privacy & messaging enabled (owner, in the AdSense console)
- [x] `privacy.md` advertising section · [x] operator name (`PAL CAPITAL, LLC`) and `privacy@lovethelaus.com` filled in
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

## Phase 4 checklist

- [x] Postgres full-text search on recipes (generated `tsvector` + GIN index, `websearch_to_tsquery`, `ts_rank`)
- [x] Pagination on the recipe list and the public cookbook list; cookbook search moved into SQL
- [x] Tag filter (clickable tags on the recipe cards) and a favorites filter
- [x] Photo gallery, chosen cover, and photo delete
- [x] Maskable PWA icons and app shortcuts
- [ ] Structured ingredients and unit conversion — **`preferredUnits` is collected but still has no reader.** It is the one preference that does not yet change anything; unit conversion is what would give it a job.
- [ ] Step timers in cook mode
- [ ] Meal plan and grocery list
- [ ] Offline cook mode that actually works offline

## Phase 5 checklist (launch)

- [x] **Database** workflow (`workflow_dispatch` only) so migrations never ride a deploy
- [x] **Smoke** workflow + `kitchen/scripts/smoke.mjs`, 18 assertions against the live site
- [x] Two Workers Builds projects documented and corrected (`kitchen` runs `build:cf` from `kitchen/`; `lovethelaus` runs `build:prod` from the root)
- [x] Legal pages: operator name and contact address
- [x] Structured logging (`src/lib/log.ts`) on the paths that used to fail silently
- [x] "Try the demo" button, resolved through the same module as the seed
- [x] Qualtrics survey removed from the marketing homepage
- [x] Onboarding finishes, and sets four preferences that each change behaviour
- [ ] AdSense pub id into `public/ads.txt`, then `NEXT_PUBLIC_ADSENSE_*` as build variables (owner)
- [ ] Forward `privacy@lovethelaus.com` (Cloudflare Email Routing) (owner)
- [ ] Workers → `kitchen` → Notifications → Script Errors alert (owner)

## Next

The two unstarted Phase 4 workstreams are the remaining product gaps:

1. **Cooking tools** — structured ingredients, unit conversion, step timers, meal plan, grocery list. Structured quantities are the dependency for the other four, so it goes first.
2. **Offline cook mode that actually works offline** — today `OfflineCookCache` writes recipe JSON nothing reads, and `sw.js` caches only that path, so the paid feature does not do what it claims.
