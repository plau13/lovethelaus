# Architecture decision record — Neon, Drizzle, Better Auth, Resend, Stripe, R2

Status: accepted 2026-09-17. Supersedes Supabase (Postgres + Auth) and Prisma.

## Decision

| Concern  | Choice                                                          | Why                                                                                                                  |
| -------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Database | **Neon Postgres** via `@neondatabase/serverless` (HTTP driver)  | Stateless per-request connections suit Cloudflare Workers; no Hyperdrive needed; branching for dev/preview.          |
| ORM      | **Drizzle** (`drizzle-orm/neon-http`, `drizzle-kit` migrations) | Small Worker bundle, first-class Better Auth adapter, SQL-shaped queries for the visibility `exists` checks.         |
| Auth     | **Better Auth** (email + password, magic link, password reset)  | Runs in-process on the Worker; its `user` table _is_ the app user table; cookie cache removes the per-render DB hit. |
| Email    | **Resend**                                                      | Fetch-based SDK works on Workers; needed for magic links, resets, and cookbook invites (previously never sent).      |
| Storage  | **Cloudflare R2** (already bound as `RECIPE_PHOTOS`)            | Keys stored in the DB; served through an authorised route. Filesystem fallback removed.                              |
| Billing  | **Stripe Checkout + Customer Portal + webhook**, hand-rolled    | Two tiers (`free`, `subscriber`), one price. `@better-auth/stripe` adds tables and routes we don't need.             |

Prod data at cutover was the owner plus demo/family testers, so this is a clean cutover: fresh Neon database, one baseline migration, demo re-seeded. No password-hash migration.

## Topology (unchanged)

```
lovethelaus.com
  └─ router Worker (workers/router)
       ├─ /kitchen/*  → kitchen Worker (Next.js 16 via OpenNext)
       │                 ├─ Neon (HTTPS)      ├─ R2 (binding)
       │                 ├─ Resend (HTTPS)    └─ Stripe (HTTPS)
       └─ /*           → Astro static assets
```

No Worker fetches itself, so `global_fetch_strictly_public` stays on.

## Request flows

1. **Page render.** `src/proxy.ts` only checks for a session cookie. Server components call `getCurrentUser()` → `auth.api.getSession`. With `session.cookieCache` (5 min, `compact`), the signed `session_data` cookie answers with zero DB queries. Logged-out renders never touch the database.
2. **Marketing form sign-in.** The Astro page still POSTs to `/kitchen/api/auth/sign-in`. That route calls `auth.api.signInEmail` in-process, copies the `Set-Cookie` headers (Path=/) onto a redirect to `/kitchen/auth/callback`, which applies the single `postAuthPath()` rule (onboarding → `/onboarding`, else `returnTo` or `/recipes`).
3. **Magic link / password reset.** Form routes call `auth.api.signInMagicLink` / `requestPasswordReset`; Resend sends the link; Better Auth's catch-all at `/kitchen/api/auth/*` verifies and redirects to the callback or to `/kitchen/reset-password?token=`. No client-side auth SDK.
4. **Demo login.** `GET /kitchen/api/auth/demo` signs in with `DEMO_USER_*` and redirects to recipes.
5. **Invites.** Unknown email → `cookbook_invite` row (email + token, 14 days) + email. A `databaseHooks.user.create.after` hook auto-accepts pending invites when that email signs up. Known email → member row + "you were added" email.
6. **Photos.** `recipe_photo.path` stores the R2 key. `photoUrl(key)` builds `/kitchen/api/recipe-photos/<key>`; the route runs `canViewRecipe` and streams from R2. Local dev gets a Miniflare R2 bucket through `initOpenNextCloudflareForDev()`.
7. **Billing.** Settings → Upgrade → Checkout Session (mode `subscription`). Stripe posts to `/kitchen/api/stripe/webhook`; `constructEventAsync` verifies; `checkout.session.completed` and `customer.subscription.*` update `user.{stripe_subscription_id, subscription_status, current_period_end, subscription_tier}`. "Manage billing" opens the Customer Portal.
8. **Public `/c/[slug]`.** Passes the proxy, layout's `getCurrentUser()` returns null without a DB call, one Drizzle query.

## Code map

| Concern                 | Files                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| DB client               | `kitchen/src/db/client.ts` (`createDb`, React-cached `getDb`)                                                                  |
| Schema                  | `kitchen/src/db/schema/{auth,app,heritage,relations,index}.ts`, migrations in `kitchen/drizzle/`                               |
| Auth instance           | `kitchen/src/lib/better-auth.ts` (lazy `getAuth()`), handler `src/app/api/auth/[...all]/route.ts`                              |
| Auth facade             | `kitchen/src/lib/auth.ts` (`getCurrentUser`, `requireUser`, `requireOnboardedUser`, `signOut`, `refreshSessionCache`)          |
| Redirect + path helpers | `kitchen/src/lib/post-auth.ts`, `kitchen/src/lib/paths.ts`                                                                     |
| Route guard             | `kitchen/src/proxy.ts`                                                                                                         |
| Email                   | `kitchen/src/lib/email.ts`, `kitchen/src/lib/email-templates.ts`                                                               |
| Billing                 | `kitchen/src/lib/stripe.ts`, `kitchen/src/lib/billing.ts`, `src/app/actions/billing.ts`, `src/app/api/stripe/webhook/route.ts` |
| Photos                  | `kitchen/src/lib/recipe-photos.ts`, `src/app/api/recipe-photos/[...key]/route.ts`                                              |
| Scripts                 | `kitchen/scripts/seed-demo.ts`, `kitchen/scripts/purge-seed-users.ts`                                                          |

## Rules that keep this working

1. **`baseURL` is the bare origin; `basePath` is `/kitchen/api/auth`.** A path in `baseURL` silently overrides `basePath`. Relative callback URLs resolve against the site root, so always pass `appPath("/…")`.
2. **Construct `auth`, `db`, and `stripe` lazily.** Never at module scope: `next build` and the first isolate must not require env.
3. **No `db.transaction()`.** neon-http has no interactive transactions. Order multi-row writes parent → child. If a true transaction is ever needed, use `drizzle-orm/neon-serverless` `Pool` for that call site.
4. **Refresh the session cache after user mutations.** Onboarding, settings, import quota, and the Stripe success page call `refreshSessionCache()` or read with `fresh: true`; otherwise the 5-minute cookie cache causes redirect loops.
5. **Next applies `basePath` inconsistently.** `redirect()` and `<Link>` add `/kitchen`; `NextResponse.redirect`, `<img src>`, manifest/icon paths, service-worker scope, and the proxy matcher do not. Route everything through `paths.ts`.
6. **Cookie names differ by scheme.** `__Secure-kitchen.session_token` on https, `kitchen.session_token` on `http://localhost`. `getSessionCookie` handles both.
7. **Lists filter, rank and page in SQL.** `recipe.search_vector` is a `GENERATED ALWAYS` weighted `tsvector` (title A, tags B, story and ingredients C, steps D) with a GIN index; `to_tsvector(regconfig, text)` is immutable with a literal config, which is what a generated column requires. Searching uses `websearch_to_tsquery` so quoted phrases, `or` and `-exclusions` work for free. Count with `countVisibleRecipes` before fetching a page, so the page number is clamped against the real total. Never load a full list to filter or count it in JavaScript — that was the original defect here.

## Environment

Worker `vars` (non-secret): `APP_URL`, `EMAIL_FROM`, `SUPPORT_EMAIL`, `STRIPE_PRICE_KITCHEN_PLUS_MONTHLY`, `STRIPE_PRICE_KITCHEN_PLUS_YEARLY`.
Worker secrets: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`, optional `ANTHROPIC_API_KEY`.
Cloudflare build variables (baked into the browser bundle, not readable at runtime): `NEXT_PUBLIC_ADSENSE_*`, `NEXT_PUBLIC_GA_ID`.
Never on the Worker: `DATABASE_URL_UNPOOLED`, which `drizzle-kit migrate` uses from a checkout or from the **Database** workflow.

## Deployment

Both Workers are built and deployed by **Workers Builds** on every push to `main`, from one project each: `kitchen` from the `kitchen/` directory, and `lovethelaus` from the repository root, which publishes the Astro build as the router's static assets. A pull-request branch uploads preview versions instead. `npm run deploy:all` from a checkout remains the fallback. Migrations are never part of a deploy — they run from the **Database** workflow, by hand.

See [`CLOUDFLARE.md`](CLOUDFLARE.md) for the runbook.
