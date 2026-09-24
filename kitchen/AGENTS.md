<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Kitchen app

Family recipe product. Lives in `/kitchen`, not the Astro marketing site.

**Agent execution:** Run all terminal commands yourself (see root [`AGENTS.md`](../AGENTS.md#agent-execution)). **Commit and deploy after each task** unless the user opts out. Only ask when blocked (e.g. missing Neon/Stripe secrets in `.env`).

- PostgreSQL on **Neon** via **Drizzle** (`src/db/schema/*`, client in `src/db/client.ts`, migrations in `drizzle/`). No `db.transaction()` (neon-http).
- **Better Auth** instance in `src/lib/better-auth.ts` (lazy `getAuth()`), facade in `src/lib/auth.ts` (`getCurrentUser`, `requireUser`, `requireOnboardedUser`). Call `refreshSessionCache()` after mutating the `user` row.
- Route groups: `src/app/(app)/` is the signed-in app (header + narrow column, reads the session); `src/app/(public)/` holds crawlable pages (`/explore`, `/c/[slug]`, `/r/[slug]`) that never read the session and carry the ad rail. Public data lives in `src/lib/public-recipes.ts`; JSON-LD/robots helpers in `src/lib/public-seo.ts`. Ads only on `(public)`, only when `NEXT_PUBLIC_ADSENSE_CLIENT` is set (see `docs/ADS.md`).
- Heritage: people in `src/lib/people.ts`, “I made this” memories and the family timeline in `src/lib/memories.ts`, pure helpers in `src/lib/heritage.ts`. Recipe provenance fields (story, originPersonId, adaptedFromRecipeId, firstMadeYear, occasion) flow through `HeritageArgs` in `src/lib/recipes.ts`. See `docs/HERITAGE.md`.
- Paths: always build `/kitchen` URLs with `src/lib/paths.ts`; post-login redirects with `src/lib/post-auth.ts`.
- Email via **Resend** (`src/lib/email.ts`); no API key locally = emails print to the console.
- Billing via **Stripe** (`src/lib/stripe.ts`, `src/app/api/stripe/webhook/route.ts`); tier helpers in `src/lib/billing.ts`, `src/lib/subscription.ts`.
- Photos in **R2** (`src/lib/recipe-photos.ts`); the DB stores keys, `photoUrl(key)` builds the URL. Up to 5MB, same bucket accessor as heritage media (`mediaBucket`).
- **The cover photo is chosen, never implied.** `recipe.coverPhotoId` names it; `coverPhoto()` in `src/lib/cover-photo.ts` (pure, no DB import, so SEO can use it) falls back to the lowest `position` when it is unset or deleted. Never read `photos[0]`. Gallery rows live in `src/lib/photos.ts`, actions in `src/app/actions/photos.ts`, UI in `src/components/photos/`.
- Heritage media (scanned cards, voice memos) shares that bucket under a `media/` prefix: storage in `src/lib/media-storage.ts`, rows in `src/lib/media.ts`, free/Plus gate in `src/lib/media-limits.ts`, served by `src/app/api/recipe-media/[...key]/route.ts` (recipe visibility rules + HTTP Range for audio), URLs from `mediaUrl(key)`.
- **One AI provider.** Claude via `@anthropic-ai/sdk` (`src/lib/anthropic.ts`, model `claude-sonnet-5`; Sonnet over Opus for cost): card transcription in `src/lib/transcribe-scan.ts`, import structuring in `src/lib/import-ai.ts`. No `ANTHROPIC_API_KEY` = both degrade quietly. There is no OpenAI path.
- Print-ready book at `/cookbooks/[id]/book` (Kitchen Plus): pure layout helpers in `src/lib/book.ts`, print rules in that route's `book.css`.
- **Search and lists run in Postgres, never in JavaScript.** `recipe.search_vector` is a generated weighted `tsvector` with a GIN index; `listVisibleRecipes` matches it with `websearch_to_tsquery` and ranks with `ts_rank`, and takes `limit`/`offset`. Pair it with `countVisibleRecipes` to fix the page first. Page arithmetic is `src/lib/pagination.ts`, query and tag normalization is `src/lib/search-terms.ts`. Use `listRecipeTitleOptions` for pickers that genuinely need every title. Never load a whole list to filter it in memory.
- Demo seed: `npm run db:seed:demo` (`demo@lovethelaus.com` + sample recipes). The seed and the "Try the demo" route both resolve the account through `src/lib/demo-account.ts`, so they cannot disagree about who it is. **Every optional env var falls back on blank, not just on undefined** — an unset GitHub Actions secret arrives as `""`, so `??` is wrong for a default and `||` is right.
- Purge legacy seed users: `npm run db:purge-seed-users`
- PWA icons: `npm run icons` regenerates the committed PNGs from `src/app/icon.svg`; re-run it whenever that SVG changes.
- Smoke test: `npm run smoke [url]` (`scripts/smoke.mjs`, standard library only) checks the deployed site — public pages, manifest `start_url`, icons, and `/kitchen/sitemap.xml` as the proof the database is reachable and migrated. Also runs as the **Smoke** workflow. Page checks follow redirects: Cloudflare serves a folder index like `dist/privacy/index.html` at `/privacy/` and redirects `/privacy` to it, so a strict 200 check on the unslashed path would call a healthy page broken. Both Workers deploy on merge to `main` via Workers Builds — `kitchen` runs `npm run build:cf` from the `kitchen` root directory (never `npm run build`, which is `next build` and writes no Worker), and `lovethelaus` runs `npm run build:prod` from the repo root and publishes `dist/` as the router's assets; migrations run from the **Database** workflow, never from a deploy.
- **Never fail silently.** A path that returns a status code and logs nothing is unobservable: `src/lib/log.ts` gives `logWarn`/`logError`/`reportError`, one JSON line with an `event` name, and `safeFields` redacts credential-shaped keys (booleans excepted — one bit is not a secret). Never pass a payload, signature or key. `reportError` also sends to Sentry when `SENTRY_DSN` is set (`src/lib/sentry.ts`, lazy init). Expected auth failures use `logWarn` only via `{ report: false }` on `errorRedirect` / `redirectActionError`. User-facing text uses `userSafeMessage` (`src/lib/errors.ts`); show it with `QueryFlash`, `FormAlert`, or `AuthError`. There is no `instrumentation.ts` on Cloudflare — see OpenNext OTEL patch in `scripts/patch-opennext-otel.mjs` (`postinstall`). Client Sentry: `src/instrumentation-client.ts` + error boundaries. Events and alerts: [`docs/CLOUDFLARE.md`](../docs/CLOUDFLARE.md).
- **Preferences configure something or they do not exist.** The four a cook sets — recipe box name, default servings, units, default cookbook visibility — are validated in one place, `src/lib/kitchen-prefs.ts`, shared by onboarding and Settings so the two forms cannot drift. Three of them change behaviour today: the box name titles the default cookbook, servings prefill `RecipeEditor`, visibility seeds a new cookbook. `preferredUnits` is collected but still has no reader — it owes one when unit conversion lands, and until then it is the exception this rule is meant to prevent. A stored answer nothing reads is a survey question, which is what the nine-question onboarding interview was before it was removed.
- **Onboarding completion is never judged from the cached session alone.** `requireOnboardedUser` re-reads fresh before redirecting to `/onboarding` and logs `onboarding.stale_session`; believing a stale cookie bounces the browser between `/recipes` and the form, which reads as a "Finish setup" button that does nothing.
- Tests: `npm test` (pure helpers: permissions, JSON-LD, social import, post-auth, billing, paths, email templates, heritage, media limits and storage, book layout, pagination, search terms, recipe filters, cover photo, photo validation, demo account, logging, kitchen preferences)
- Cook mode: `/recipes/[id]/cook` (wake lock + large type)
- Nav: Home, Recipes, Cookbooks, Family + user menu (Settings)
- Brand: [`docs/BRAND.md`](../docs/BRAND.md)
- Architecture and gotchas: [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)
- Auth, and how to debug a sign-in that fails: [`docs/AUTH.md`](../docs/AUTH.md) — Better Auth returns one message for three different causes, and only the Worker log says which
- Testing: [`docs/TESTING.md`](../docs/TESTING.md) — run the full Auth matrix when touching auth/email; the Billing section when touching Stripe
- Credentials and provider setup: [`docs/CREDENTIALS.md`](../docs/CREDENTIALS.md)
- Roadmap: [`docs/ROADMAP.md`](../docs/ROADMAP.md), ads: [`docs/ADS.md`](../docs/ADS.md), differentiation: [`docs/HERITAGE.md`](../docs/HERITAGE.md)
