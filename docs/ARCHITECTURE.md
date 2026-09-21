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

Auth has its own document — [`AUTH.md`](AUTH.md) — covering the table layout, the cookie cache, and how to debug a failing sign-in. The summary below is the shape; that is the detail.

1. **Page render.** `src/proxy.ts` only checks for a session cookie. Server components call `getCurrentUser()` → `auth.api.getSession`. With `session.cookieCache` (5 min, `compact`), the signed `session_data` cookie answers with zero DB queries. Logged-out renders never touch the database.
2. **Marketing form sign-in.** The Astro page still POSTs to `/kitchen/api/auth/sign-in`. That route calls `auth.api.signInEmail` in-process, copies the `Set-Cookie` headers (Path=/) onto a redirect to `/kitchen/auth/callback`, which applies the single `postAuthPath()` rule (onboarding → `/onboarding`, else `returnTo` or `/recipes`).
3. **Magic link / password reset.** Form routes call `auth.api.signInMagicLink` / `requestPasswordReset`; Resend sends the link; Better Auth's catch-all at `/kitchen/api/auth/*` verifies and redirects to the callback or to `/kitchen/reset-password?token=`. No client-side auth SDK.
4. **Demo login.** The "Try the demo" button on `/sign-in` hits `GET /kitchen/api/auth/demo`, which signs in with the seeded account and redirects to recipes. The route and `npm run db:seed:demo` both resolve the address through `src/lib/demo-account.ts`, so they cannot disagree about who the demo user is; with no `DEMO_USER_PASSWORD` the button is hidden and the route says so rather than failing silently.
5. **Invites.** Unknown email → `cookbook_invite` row (email + token, 14 days) + email. A `databaseHooks.user.create.after` hook auto-accepts pending invites when that email signs up. Known email → member row + "you were added" email.
6. **Photos.** `recipe_photo.path` stores the R2 key. `photoUrl(key)` builds `/kitchen/api/recipe-photos/<key>`; the route runs `canViewRecipe` and streams from R2. Local dev gets a Miniflare R2 bucket through `initOpenNextCloudflareForDev()`.
7. **Billing.** Settings → Upgrade → Checkout Session (mode `subscription`). Stripe posts to `/kitchen/api/stripe/webhook`; `constructEventAsync` verifies; `checkout.session.completed` and `customer.subscription.*` update `user.{stripe_subscription_id, subscription_status, current_period_end, subscription_tier}`. "Manage billing" opens the Customer Portal.
8. **Public `/c/[slug]`.** Passes the proxy, layout's `getCurrentUser()` returns null without a DB call, one Drizzle query.
9. **Onboarding.** A new signup lands on `/onboarding` via `postAuthPath()`. The form collects four preferences, `saveOnboarding` writes them plus `onboardingCompletedAt`, renames the default cookbook, calls `refreshSessionCache()`, and redirects to `/recipes`. `requireOnboardedUser` re-reads fresh before it would bounce anyone back — see [`AUTH.md`](AUTH.md).

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
| Preferences             | `kitchen/src/lib/kitchen-prefs.ts` (one validator, shared by onboarding and Settings)                                          |
| Observability           | `kitchen/src/lib/log.ts` (`logWarn`, `logError`, `safeFields`)                                                                 |
| Demo account            | `kitchen/src/lib/demo-account.ts` (shared by the seed and the "Try the demo" route)                                            |
| Scripts                 | `kitchen/scripts/seed-demo.ts`, `kitchen/scripts/purge-seed-users.ts`, `kitchen/scripts/smoke.mjs`                             |

## Rules that keep this working

1. **`baseURL` is the bare origin; `basePath` is `/kitchen/api/auth`.** A path in `baseURL` silently overrides `basePath`. Relative callback URLs resolve against the site root, so always pass `appPath("/…")`.
2. **Construct `auth`, `db`, and `stripe` lazily.** Never at module scope: `next build` and the first isolate must not require env.
3. **No `db.transaction()`.** neon-http has no interactive transactions. Order multi-row writes parent → child. If a true transaction is ever needed, use `drizzle-orm/neon-serverless` `Pool` for that call site.
4. **Refresh the session cache after user mutations.** Onboarding, settings, import quota, and the Stripe success page call `refreshSessionCache()` or read with `fresh: true`; otherwise the 5-minute cookie cache causes redirect loops.
5. **Next applies `basePath` inconsistently.** `redirect()` and `<Link>` add `/kitchen`; `NextResponse.redirect`, `<img src>`, manifest/icon paths, service-worker scope, and the proxy matcher do not. Route everything through `paths.ts`.
6. **Cookie names differ by scheme.** `__Secure-kitchen.session_token` on https, `kitchen.session_token` on `http://localhost`. `getSessionCookie` handles both.
7. **Lists filter, rank and page in SQL.** `recipe.search_vector` is a `GENERATED ALWAYS` weighted `tsvector` (title A, tags B, story and ingredients C, steps D) with a GIN index; `to_tsvector(regconfig, text)` is immutable with a literal config, which is what a generated column requires. Searching uses `websearch_to_tsquery` so quoted phrases, `or` and `-exclusions` work for free. Count with `countVisibleRecipes` before fetching a page, so the page number is clamped against the real total. Never load a full list to filter or count it in JavaScript — that was the original defect here.

8. **A preference configures something, or it does not exist.** The four a cook sets — recipe box name, default servings, units, default cookbook visibility — are validated in exactly one module, `kitchen/src/lib/kitchen-prefs.ts`, because onboarding and Settings collect the same values and two validators is how two forms drift. Three of the four change behaviour today: the box name titles the default cookbook, servings prefill `RecipeEditor`, and visibility seeds a new cookbook. **`preferredUnits` is the exception — it is collected and stored but nothing reads it yet**, and by the rule above that makes it a survey question until unit conversion lands (Phase 4). It is tracked as owing a reader rather than quietly left as decoration.

   The rule exists because the opposite was shipped: onboarding asked nine open-ended questions and stored the answers as JSON nothing ever read, while `defaultServings` and `preferredUnits` sat in the schema unread. A stored answer with no reader is a survey question, not a preference.

9. **Never fail silently.** A path that returns a status code and logs nothing is unobservable. `kitchen/src/lib/log.ts` emits one JSON line with an `event` name; `safeFields` redacts credential-shaped keys, booleans excepted, since one bit cannot be a secret. Never pass a payload, signature or key — the redactor is a backstop for mistakes, not a licence. Current events and the alert setup are in [`CLOUDFLARE.md`](CLOUDFLARE.md).

## Onboarding and preferences

`user` carries the profile because Better Auth's table is the app's table (see [`AUTH.md`](AUTH.md)). The preference columns are `default_servings`, `preferred_units`, `default_cookbook_visibility`, plus `onboarding_completed_at` as the gate.

| Preference           | Column                              | What reads it                                                  |
| -------------------- | ----------------------------------- | -------------------------------------------------------------- |
| Recipe box name      | `cookbook.title` where `is_default` | The cookbooks page and every default-cookbook heading          |
| Default servings     | `default_servings`                  | `recipes/new` and `recipes/[id]/edit` prefill `RecipeEditor`   |
| Units                | `preferred_units`                   | **Nothing yet** — owes a reader; see Phase 4 unit conversion   |
| New cookbook sharing | `default_cookbook_visibility`       | `cookbooks/new` and `actions/cookbooks.ts` seed the visibility |

The recipe box name is deliberately **not** a column on `user`: the default cookbook already has a title, and a second copy would need syncing. Onboarding renames the row the signup hook created.

`onboarding_answers` remains on `user` as a dead column. Dropping it would destroy answers real users gave, and it costs nothing to keep; `better-auth.ts` marks it `returned: false` so it never reaches a client. The separate `/interview` page and its `interview_response` table are a **different feature** and are untouched by this — do not confuse the two when grepping for "interview".

## Environment

Worker `vars` (non-secret): `APP_URL`, `EMAIL_FROM`, `SUPPORT_EMAIL`, `STRIPE_PRICE_KITCHEN_PLUS_MONTHLY`, `STRIPE_PRICE_KITCHEN_PLUS_YEARLY`.
Worker secrets: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`, optional `ANTHROPIC_API_KEY`.
Cloudflare **build** variables, set under Workers → `kitchen` → Settings → Build (baked into the browser bundle by `opennextjs-cloudflare build`, so a Worker secret would arrive too late and a runtime lookup would find nothing): `NEXT_PUBLIC_ADSENSE_*`, `NEXT_PUBLIC_GA_ID`.
Never on the Worker: `DATABASE_URL_UNPOOLED`, which `drizzle-kit migrate` uses from a checkout or from the **Database** workflow.

## Deployment

Both Workers are built and deployed by **Workers Builds** on every push to `main`, from one project each: `kitchen` from the `kitchen/` directory, and `lovethelaus` from the repository root, which publishes the Astro build as the router's static assets. A pull-request branch uploads preview versions instead. `npm run deploy:all` from a checkout remains the fallback. Migrations are never part of a deploy — they run from the **Database** workflow, by hand.

See [`CLOUDFLARE.md`](CLOUDFLARE.md) for the runbook.
