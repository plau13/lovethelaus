# Deploy Love the Laus on Cloudflare

Single domain: **`lovethelaus.com`**

| Path         | App                            |
| ------------ | ------------------------------ |
| `/`          | Marketing (Astro static)       |
| `/kitchen/*` | Kitchen (Next.js via OpenNext) |

A **router Worker** (`lovethelaus`) owns the domain and forwards `/kitchen/*` to the Kitchen Worker via a service binding.

## Architecture

```
lovethelaus.com
       │
       ▼
  router Worker (lovethelaus)
       ├── /kitchen/*  →  kitchen Worker (OpenNext)
       └── /*          →  marketing static assets (dist/)
```

> **Setting up for the first time?** [`CREDENTIALS.md`](CREDENTIALS.md) walks through every account and key, and how to obtain each one.

## Prerequisites

```bash
npm install -g wrangler
wrangler login
```

Create R2 buckets (once, from `kitchen/`):

```bash
npx wrangler r2 bucket create kitchen-opennext-cache
npx wrangler r2 bucket create kitchen-recipe-photos
```

## Kitchen secrets

Non-secret config lives in `kitchen/wrangler.jsonc` under `vars` (`APP_URL`, `EMAIL_FROM`, `SUPPORT_EMAIL`, `STRIPE_PRICE_KITCHEN_PLUS_MONTHLY`, `STRIPE_PRICE_KITCHEN_PLUS_YEARLY`, `SENTRY_ENVIRONMENT`). Secrets are set from `kitchen/`:

```bash
npx wrangler secret put DATABASE_URL          # Neon pooled connection string
npx wrangler secret put BETTER_AUTH_SECRET    # openssl rand -base64 32
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET # from the Stripe webhook endpoint
npx wrangler secret put DEMO_USER_EMAIL       # demo@lovethelaus.com
npx wrangler secret put DEMO_USER_PASSWORD    # same value used for db:seed:demo
# optional
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put SENTRY_DSN          # optional; see docs/CREDENTIALS.md
```

Remove the retired Supabase secrets once the cutover is verified:

```bash
npx wrangler secret delete NEXT_PUBLIC_SUPABASE_URL
npx wrangler secret delete NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

After changing bindings run `npm run cf-typegen` locally to regenerate `cloudflare-env.d.ts` (gitignored; it embeds the full Workers runtime types).

### One-time provider setup

| Provider   | Steps                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Neon**   | Create project `kitchen`; branches `main` (prod) and `dev`. Pooled URL → `DATABASE_URL`; direct URL → `DATABASE_URL_UNPOOLED` (local/CI migrations only).                                                                                                                                                                                               |
| **Resend** | Verify `lovethelaus.com` (SPF + DKIM); create an API key; set `EMAIL_FROM` in `wrangler.jsonc`. Until the domain is verified Resend only delivers to the account owner.                                                                                                                                                                                 |
| **Stripe** | Product "Kitchen Plus" with monthly and annual recurring prices → `STRIPE_PRICE_KITCHEN_PLUS_MONTHLY` and `STRIPE_PRICE_KITCHEN_PLUS_YEARLY` in `wrangler.jsonc`. Webhook endpoint `https://lovethelaus.com/kitchen/api/stripe/webhook` with events `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` → `STRIPE_WEBHOOK_SECRET`. Enable the Customer Portal. |

### Build-time public config (ads, analytics, Sentry client)

`NEXT_PUBLIC_*` values are compiled into the client bundle, so they belong in **Workers → kitchen → Settings → Build → Build variables** (what Workers Builds reads during `npm run build:cf`). They are not Worker secrets — a runtime secret of that name does nothing — and changing one requires a rebuild.

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser error reporting (same DSN as `SENTRY_DSN`; see [`CREDENTIALS.md`](CREDENTIALS.md) §6) |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | Optional; browser Sentry environment tag (defaults to `NODE_ENV`) |
| `NEXT_PUBLIC_ADSENSE_*`, `NEXT_PUBLIC_GA_ID` | Ads and analytics — see [`ADS.md`](ADS.md) |

Optional **source map upload** during `build:cf` (readable stack traces in Sentry): set `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` as build variables or GitHub secrets visible to Workers Builds — not as Worker runtime secrets.

### OpenNext + Sentry build patch

Sentry pulls in `@opentelemetry/api`, which breaks OpenNext middleware bundling for `proxy.ts`. [`kitchen/scripts/patch-opennext-otel.mjs`](../kitchen/scripts/patch-opennext-otel.mjs) runs on `postinstall` and aliases OpenTelemetry to Next's compiled copy. **Do not skip `postinstall`** (`npm ci --ignore-scripts` will break `build:cf`). There is no `instrumentation.ts` — OpenNext on Cloudflare cannot load Next's instrumentation hook with Sentry; server errors reach Sentry only through explicit `reportError()` calls in [`kitchen/src/lib/log.ts`](../kitchen/src/lib/log.ts).

## Secrets & environment variables

### Where values live

| Location                              | Used for                                | Committed to git?                      | Encrypted at rest?                                         |
| ------------------------------------- | --------------------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| `kitchen/.env`                        | Local dev (Prisma, Next)                | **No** (`.gitignore`)                  | Your machine only                                          |
| `kitchen/.dev.vars`                   | Local `wrangler dev` / OpenNext preview | **No** (`.gitignore`)                  | Your machine only                                          |
| **Wrangler secrets**                  | Production Kitchen Worker               | **No** — stored in Cloudflare          | **Yes** (Cloudflare encrypts; never returned after upload) |
| `wrangler.jsonc` `vars`               | Non-sensitive config only               | Yes                                    | N/A (plain text in repo)                                   |
| Build-time env (`PUBLIC_KITCHEN_URL`) | Marketing HTML at build                 | No secrets — baked into static `dist/` | N/A                                                        |

### Production Kitchen secrets (current)

Set via `npx wrangler secret put <NAME>` from `kitchen/`:

| Secret                  | Sensitive?         | Notes                                                 |
| ----------------------- | ------------------ | ----------------------------------------------------- |
| `DATABASE_URL`          | **Yes**            | Neon pooled connection string; never in repo          |
| `BETTER_AUTH_SECRET`    | **Yes**            | Signs session cookies; rotating it signs everyone out |
| `RESEND_API_KEY`        | **Yes**            | Transactional email                                   |
| `STRIPE_SECRET_KEY`     | **Yes**            | Server-side Stripe API                                |
| `STRIPE_WEBHOOK_SECRET` | **Yes**            | Verifies webhook signatures                           |
| `DEMO_USER_EMAIL`       | No                 | Demo sign-in email (Try demo)                         |
| `DEMO_USER_PASSWORD`    | **Yes**            | Demo account password; set before `db:seed:demo`      |
| `ANTHROPIC_API_KEY`     | **Yes** (optional) | Card transcription and AI structuring of imports      |
| `SENTRY_DSN`            | **Yes**            | Server-side error reporting to Sentry                 |

List what's configured (names only, not values):

```bash
cd kitchen && npx wrangler secret list
```

Rotate a secret: run `wrangler secret put <NAME>` again with the new value.

### What is NOT secret

- `wrangler.jsonc` `vars` (`APP_URL`, `EMAIL_FROM`, `SUPPORT_EMAIL`, `STRIPE_PRICE_KITCHEN_PLUS_*`, `SENTRY_ENVIRONMENT`) are public config.
- Marketing `PUBLIC_KITCHEN_URL` is compiled into static HTML — that's fine; it's a public URL.
- The **router Worker** (`lovethelaus`) has no secrets — it only routes traffic and serves public static files.

### What to never commit

- `kitchen/.env`, `kitchen/.env.local`, `kitchen/.dev.vars`
- Root `.env`
- Any file containing `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, or API keys

Only `.env.example` and `.dev.vars.example` (placeholders) belong in git.

### Local vs production

- **Local:** copy `kitchen/.env.example` → `kitchen/.env` with your Neon `dev` branch credentials. Without `RESEND_API_KEY` emails are printed to the dev server console.
- **Production:** use Wrangler secrets only; do not upload `.env` to Cloudflare.
- **Migrations:** run locally/CI with `DATABASE_URL_UNPOOLED` — never from the Worker.

## Deploy

**Kitchen deploys itself.** A Workers Builds Git integration watches this repository, so merging to `main` builds and deploys the `kitchen` Worker; a pull-request branch uploads a preview version instead and reports as the `Workers Builds: kitchen` check. Its build settings live in **Workers → kitchen → Settings → Build** and must match the monorepo layout:

| Field                                     | Value                          |
| ----------------------------------------- | ------------------------------ |
| Root directory                            | `kitchen`                      |
| Build command                             | `npm run build:cf`             |
| Deploy command                            | `npx wrangler deploy`          |
| Version command (non-production branches) | `npx wrangler versions upload` |
| Production branch                         | `main`                         |

Both of the first two matter, and the defaults get both wrong. With root directory `/`, `npm run build` is the Astro site's build — it succeeds, and then `wrangler` looks for a Worker at the repository root, where there is no `wrangler.jsonc`, and fails with _Missing entry-point to Worker script or to assets directory_. With root directory `kitchen` but the default build command, `next build` runs but never writes `.open-next/worker.js`, which is what `wrangler.jsonc` points `main` at — so the deploy fails the same way. `npm run build:cf` is `opennextjs-cloudflare build`, named in `package.json` so the dashboard and the repo cannot drift apart.

**So does the marketing site**, through a second Workers Builds project on the **`lovethelaus`** router Worker. It serves the Astro build as its static assets, so deploying the router is what publishes the marketing site — the two are one step. Under **Workers → lovethelaus → Settings → Build**:

| Field                                     | Value                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------- |
| Root directory                            | `/`                                                                   |
| Build command                             | `npm run build:prod`                                                  |
| Deploy command                            | `npx wrangler deploy --config workers/router/wrangler.jsonc`          |
| Version command (non-production branches) | `npx wrangler versions upload --config workers/router/wrangler.jsonc` |
| Production branch                         | `main`                                                                |

`npm run build:prod` sets `PUBLIC_KITCHEN_URL`, and `workers/router/wrangler.jsonc` points `assets.directory` at `../../dist`, so a merge to `main` rebuilds and republishes both. The router attaches `lovethelaus.com` as a custom domain on deploy.

This project exists because the router went **two weeks without a deploy** while Kitchen shipped daily: `ads.txt`, the robots.txt pointing at the Kitchen sitemap, and the privacy policy's advertising section were all committed and none were live. Nothing warned anyone. A site that deploys only when someone remembers to deploy it is a site that silently stops matching its own repository.

The manual path still works from a checkout, and is the fallback if the integration is ever disconnected:

```bash
npm run deploy:all      # Astro site + kitchen + router
npm run deploy:router   # the router and the marketing assets alone
```

Afterwards, `npm run smoke` from `kitchen/`, or the **Smoke** workflow in Actions, checks the live site without needing a checkout. It follows redirects, because Cloudflare's default `html_handling` (`auto-trailing-slash`) serves a folder index like `dist/privacy/index.html` at `/privacy/` and redirects `/privacy` to it — a bare 200 check on the unslashed path sees the 308 and reports a healthy page as broken.

## Knowing when something breaks

Workers Logs keeps everything this Worker writes (`observability` in `kitchen/wrangler.jsonc`, sampling 1). Collection was never the gap — the gap was that several failure paths returned a status code and said nothing. Those now emit one JSON line each, through `kitchen/src/lib/log.ts`. Unexpected server failures also reach **Sentry** when `SENTRY_DSN` is set (`reportError` in `log.ts`). **User-facing** text (redirects, form alerts) is sanitized via `userSafeMessage` in `errors.ts`; Sentry receives the raw exception for triage, with cookies/auth headers stripped in `beforeSend`.

Filter on `event` in **Workers → kitchen → Logs**. Never log a payload, a signature or a key: `safeFields` redacts values under credential-shaped names as a backstop, but it is a safety net for mistakes, not a reason to pass raw objects.

### Event catalog

| Event | Level | Sentry? | Means |
| ----- | ----- | ------- | ----- |
| **Stripe** | | | |
| `stripe.webhook.bad_signature` | error | no | Signature verification failed. Usually the signing secret was rotated on one side only — payment succeeds, the account stays free. |
| `stripe.webhook.not_configured` | error | no | `STRIPE_WEBHOOK_SECRET` is unset on the Worker. |
| `stripe.webhook.handler_failed` | error | yes | Webhook verified but applying subscription state threw (DB, Stripe API). Stripe retries on 500. |
| **Auth (expected failures — Cloudflare only)** | | | |
| `auth.sign_up_failed` | warn | no | Sign-up rejected (duplicate email, weak password, etc.). |
| `auth.sign_in_failed` | warn | no | Wrong email/password. |
| `auth.magic_link_failed` | warn | no | Magic-link request failed. |
| `auth.password_reset_failed` | warn | no | Reset request or token save failed. |
| `auth.demo_unavailable` | warn | no | Demo password not configured on the Worker. |
| `auth.demo_failed` | error | yes | Demo sign-in threw after credentials were present. |
| `auth.sign_out_failed` | error | yes | Sign-out threw unexpectedly. |
| `auth.email_failed` | error | yes | Resend rejected or errored sending transactional mail. |
| **Client error boundaries** | | | |
| `app.error_boundary` | — | yes | React error in signed-in app (`(app)/error.tsx`). |
| `public.error_boundary` | — | yes | React error on public pages (`(public)/error.tsx`). |
| `global.error_boundary` | — | yes | Root layout failure (`global-error.tsx`). |
| **Billing & settings** | | | |
| `billing.checkout_failed` | error | yes | Stripe Checkout session could not be created. |
| `billing.portal_failed` | error | yes | Customer Portal session failed. |
| `billing.refresh_failed` | error | yes | Post-checkout session refresh failed. |
| `settings.profile_update_failed` | error | yes | Profile or kitchen prefs save failed. |
| **Import** | | | |
| `import.start_failed` | error | yes | URL import could not start (fetch, limit, DB). |
| `import.confirm_failed` | error | yes | Confirming a draft into a recipe failed. |
| `import.ai_unavailable` | warn | no | Claude could not be reached during an import; the user still got their draft. |
| **Recipes** | | | |
| `recipes.create_failed` | error | yes | New recipe save failed. |
| `recipes.update_failed` | error | yes | Recipe edit failed. |
| `recipes.note_failed` | error | yes | Adding a note failed. |
| `recipes.copy_failed` | error | yes | Copy to my book failed. |
| `recipes.memory_failed` | error | yes | “I made this” failed. |
| `recipes.memory_remove_failed` | error | yes | Removing a memory failed. |
| `recipes.transcript_apply_failed` | error | yes | Applying card transcript to recipe failed. |
| `recipes.favorite_failed` | error | yes | Favorite toggle failed (optimistic UI rolls back). |
| **Photos & media** | | | |
| `photos.upload_failed` | error | yes | Recipe photo upload failed. |
| `photos.delete_failed` | error | yes | Photo delete failed. |
| `photos.cover_failed` | error | yes | Set cover failed. |
| `photos.alt_failed` | error | yes | Alt text save failed. |
| `media.scan_upload_failed` | error | yes | Card scan upload failed. |
| `media.voice_upload_failed` | error | yes | Voice memo upload failed. |
| `media.remove_failed` | error | yes | Heritage media delete failed. |
| `media.caption_failed` | error | yes | Media caption save failed. |
| `transcribe.scan_failed` | error | yes | Claude card read failed. |
| `photo.object_missing` | error | no | A `recipe_photo` row points at an R2 object that is not there. |
| **Cookbooks & sharing** | | | |
| `cookbooks.create_failed` | error | yes | New cookbook failed. |
| `cookbooks.settings_failed` | error | yes | Cookbook settings save failed. |
| `cookbooks.invite_failed` | error | yes | Invite link creation failed. |
| `cookbooks.join_failed` | error | yes | Accepting an invite failed. |
| `cookbooks.add_recipe_failed` | error | yes | Adding a recipe to a cookbook failed. |
| `cookbooks.grant_batch_failed` | error | yes | Batch email invite failed. |
| `cookbooks.revoke_failed` | error | yes | Removing a member failed. |
| `cookbooks.favorite_failed` | error | yes | Cookbook favorite toggle failed. |
| `cookbooks.invite_link_failed` | error | yes | Share-dialog invite URL failed. |
| `collaborators.grant_failed` | error | yes | Single recipe share failed. |
| `collaborators.grant_batch_failed` | error | yes | Batch recipe share failed. |
| `collaborators.revoke_failed` | error | yes | Recipe collaborator remove failed. |
| **Family & onboarding** | | | |
| `people.create_failed` | error | yes | New family person failed. |
| `people.update_failed` | error | yes | Person edit failed. |
| `people.remove_failed` | error | yes | Person delete failed. |
| `people.create_inline_failed` | error | yes | Inline “Add someone” in recipe editor failed. |
| `onboarding.save_failed` | error | yes | First-run setup failed. |
| `onboarding.stale_session` | warn | no | Finished onboarding but cached session was stale (harmless if rare). |
| `interview.save_failed` | error | yes | Mom interview save failed. |

To be told rather than have to look:

1. **Cloudflare dashboard → Notifications → Workers → Script Errors** (scoped to `kitchen`).
2. **Sentry → Alerts → Create Alert** → "Issues" → "A new issue is created" → notify email or Slack. Scope to the `kitchen` project. Repeat for regression spikes if desired.
3. After any Stripe change, glance at `stripe.webhook.*` in Workers Logs.

Without `SENTRY_AUTH_TOKEN` in the build environment, Sentry issues show minified stack traces — set org/project/token per [`CREDENTIALS.md`](CREDENTIALS.md) §6.

## Local dev

```bash
# Terminal 1 — marketing
npm run dev

# Terminal 2 — kitchen (served at /kitchen)
cd kitchen && npm run dev
# → http://localhost:3000/kitchen
```

Set `PUBLIC_KITCHEN_URL=http://localhost:3000/kitchen` and `APP_URL=http://localhost:3000/kitchen`.

## Migrations

Drizzle migrations live in `kitchen/drizzle/`. Run against Neon from a laptop or CI (not from Workers):

```bash
cd kitchen
npm run db:generate   # after editing src/db/schema/*
npm run db:migrate    # applies pending migrations using DATABASE_URL_UNPOOLED
npm run db:seed:demo  # demo account + sample recipes
```

Local Stripe webhooks: `stripe listen --forward-to localhost:3000/kitchen/api/stripe/webhook`.

## Verify

- `https://lovethelaus.com` — landing page
- `https://lovethelaus.com/kitchen/login` — Kitchen auth
- Open Kitchen CTA links to `/kitchen`
