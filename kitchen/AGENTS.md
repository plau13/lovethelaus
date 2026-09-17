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
- Photos in **R2** (`src/lib/recipe-photos.ts`); the DB stores keys, `photoUrl(key)` builds the URL.
- Demo seed: `npm run db:seed:demo` (`demo@lovethelaus.com` + sample recipes)
- Purge legacy seed users: `npm run db:purge-seed-users`
- Tests: `npm test` (pure helpers: permissions, JSON-LD, social import, post-auth, billing, paths, email templates)
- Cook mode: `/recipes/[id]/cook` (wake lock + large type)
- Nav: Home, Recipes, Cookbooks + user menu (Settings)
- Brand: [`docs/BRAND.md`](../docs/BRAND.md)
- Architecture and gotchas: [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)
- Testing: [`docs/TESTING.md`](../docs/TESTING.md) — run the full Auth matrix when touching auth/email; the Billing section when touching Stripe
- Roadmap: [`docs/ROADMAP.md`](../docs/ROADMAP.md), ads: [`docs/ADS.md`](../docs/ADS.md), differentiation: [`docs/HERITAGE.md`](../docs/HERITAGE.md)
