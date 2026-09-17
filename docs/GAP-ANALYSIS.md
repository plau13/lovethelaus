# Gap analysis — Kitchen vs. the online cookbook market

Audit date: 2026-09-17. Scope: `kitchen/` (product) and the marketing site. Everything below was confirmed by reading the code, not guessed. See [`ROADMAP.md`](ROADMAP.md) for sequencing and [`ARCHITECTURE.md`](ARCHITECTURE.md) for the stack decisions that clear the tech-debt items.

## Where Kitchen already stands out

- **Living, collaborative recipes.** Per-recipe collaborators with `view / comment / edit / co-author` roles, family notes, and automatic version snapshots on every edit. Most consumer recipe apps have none of this.
- **Import with a human confirm step.** URL import (schema.org JSON-LD) and social captions land in an `ImportDraft` the user reviews before saving. Optional AI structuring.
- **Anti lock-in export.** Stable JSON v1 export format documented in [`kitchen/docs/export-format.md`](../kitchen/docs/export-format.md).
- **Cook-mode ergonomics.** Wake lock, large type, 48 px touch targets, ingredient check-off, servings scaling.
- **Brand.** Warm paper/ink/clay palette and serif recipe titles read as a family object, not a SaaS tool.

## Competitive gaps (confirmed absent)

| Gap                          | Why it matters                                                                                                                                                                                                                                                                                   | Evidence                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| No public discovery surface  | Nothing to index, share, or monetize. Public cookbooks have no `generateMetadata`, no JSON-LD, no sitemap/robots, no OG image, and don't render photos.                                                                                                                                          | `src/app/c/[slug]/page.tsx`; `generateMetadata` and `ld+json` appear nowhere in `kitchen/src` |
| No public single-recipe page | `/c/[slug]` dumps every recipe on one page. Search engines and social previews want one URL per recipe.                                                                                                                                                                                          | same file                                                                                     |
| Search doesn't scale         | Structured filters run in Postgres, then every visible row is loaded and text-filtered in JS. No pagination anywhere. `/cookbooks` loads all public cookbooks per visit.                                                                                                                         | `src/lib/recipes.ts` `listVisibleRecipes`, `src/lib/cookbooks.ts` `listCookbooksForUser`      |
| Free-text ingredients        | Scaling is regex on a leading number; `preferredUnits` is stored and never read; no unit conversion; no structured quantities for grocery lists or nutrition.                                                                                                                                    | `src/lib/scale-ingredients.ts`, `User.preferredUnits`                                         |
| Table stakes missing         | Recipe/cookbook delete, photo gallery + cover + delete (uploads append forever, only `photos[0]` is shown), meal plan, grocery list, step timers, nutrition, print button (print CSS exists), tag filter, favorites page, cookbook reorder (`position` unused), remove-from-cookbook, dark mode. | grep for each term                                                                            |
| Sharing friction             | Email invites require an existing account and **no invite email is ever sent**; token links work but there is no return-to-invite after sign-in.                                                                                                                                                 | `addCookbookMemberByEmail`, `setRecipeCollaborator`, `invite/[token]/page.tsx`                |
| Offline is write-only        | `OfflineCookCache` writes recipe JSON that nothing reads; `sw.js` caches only that path, so the paid "offline cook mode" does not work offline.                                                                                                                                                  | `src/components/OfflineCookCache.tsx`, `public/sw.js`                                         |
| Import edges                 | Instagram legacy oEmbed endpoint is dead; `enrichWithVideoAnalysis` is a stub; no paste/photo/OCR/bulk import despite `SOURCE_TYPES` including `card`.                                                                                                                                           | `src/lib/import-social.ts`, `src/lib/import-ai.ts`                                            |
| No payments                  | `subscriptionTier` is only ever set by the demo seed; Settings "Plan" is static text; nobody can become a subscriber.                                                                                                                                                                            | grep `stripe                                                                                  | checkout | billing` = 0 |
| PWA                          | SVG-only icon (iOS ignores it), no maskable PNGs, no shortcuts/share_target.                                                                                                                                                                                                                     | `src/app/manifest.ts`                                                                         |

## Tech debt cleared by the stack migration

- New Prisma client + adapter per request; `@prisma/adapter-pg` v7 paired with `@prisma/client` v6 (real mismatch in the lockfile).
- `getCurrentUser()` made a Supabase network call plus a DB query on every layout render.
- `/kitchen` hardcoded in ~10 places; onboarding redirect logic duplicated 4–5×; two URL helpers with different semantics.
- `RecipePhoto.path` mixed R2 route URLs with `/uploads/...` disk paths; the fallback `catch {}` hid real R2 failures.
- No `cloudflare-env.d.ts` (bindings typed by hand-written casts).
- Dead code: `RecipeForm.tsx`, `RecipeIndexTabs.tsx`, `sharing.ts`, `/loved-ones` (redirect), `/recipes/[id]/cook` (unlinked), `/interview` (unlinked, answers never read).
- Template leftovers from AstroWind: Netlify/Vercel/Docker/nginx configs, a Cloudflare Pages `wrangler.jsonc`, `@astrojs/rss`, demo `googleSiteVerificationId` and Twitter handle.
- CI built only the Astro root; Kitchen was never built or tested in CI.
- No security headers on either surface.
- `privacy.md` / `terms.md` still contain `[Company Legal Name]` placeholders; privacy has no advertising/cookie section.

## What "unique" should mean here

Competitors treat a recipe as data. The interview script and onboarding questions show the actual job: preserving a family's cooking so it cannot be lost. The differentiation is **heritage and story** — provenance, lineage, scanned cards, voice memos, a family timeline — specified in [`HERITAGE.md`](HERITAGE.md).
