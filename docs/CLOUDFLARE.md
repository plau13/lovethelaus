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

Non-secret config lives in `kitchen/wrangler.jsonc` under `vars` (`APP_URL`, `EMAIL_FROM`, `SUPPORT_EMAIL`, `STRIPE_PRICE_KITCHEN_PLUS`). Secrets are set from `kitchen/`:

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
| **Stripe** | Product "Kitchen Plus" with one recurring price → `STRIPE_PRICE_KITCHEN_PLUS`. Webhook endpoint `https://lovethelaus.com/kitchen/api/stripe/webhook` with events `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` → `STRIPE_WEBHOOK_SECRET`. Enable the Customer Portal. |

### Build-time public config (ads, analytics)

`NEXT_PUBLIC_ADSENSE_*` and `NEXT_PUBLIC_GA_ID` are compiled into the client bundle, so they belong in **Settings → Build → Build variables**, which is what the Workers Build that bakes them in can read. They are not Worker secrets — one set under Variables and Secrets has no effect — and changing them requires a rebuild. Locally they come from `kitchen/.env`. See [`ADS.md`](ADS.md).

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

List what's configured (names only, not values):

```bash
cd kitchen && npx wrangler secret list
```

Rotate a secret: run `wrangler secret put <NAME>` again with the new value.

### What is NOT secret

- `wrangler.jsonc` `vars` (`APP_URL`, `EMAIL_FROM`, `SUPPORT_EMAIL`, `STRIPE_PRICE_KITCHEN_PLUS`) are public config.
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

Workers Logs keeps everything this Worker writes (`observability` in `kitchen/wrangler.jsonc`, sampling 1). Collection was never the gap — the gap was that several failure paths returned a status code and said nothing. Those now emit one JSON line each, through `kitchen/src/lib/log.ts`:

| Event                           | Means                                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `stripe.webhook.bad_signature`  | Signature verification failed. Usually the signing secret was rotated on one side only — payment succeeds, the account stays free. |
| `stripe.webhook.not_configured` | `STRIPE_WEBHOOK_SECRET` is unset on the Worker.                                                                                    |
| `photo.object_missing`          | A `recipe_photo` row points at an R2 object that is not there.                                                                     |
| `import.ai_unavailable`         | Claude could not be reached during an import; the user still got their draft.                                                      |

Filter on `event` in **Workers → kitchen → Logs**. Never log a payload, a signature or a key: `safeFields` redacts values under credential-shaped names as a backstop, but it is a safety net for mistakes, not a reason to pass raw objects.

To be told rather than have to look, add a notification: **Cloudflare dashboard → Notifications → Add → Workers → Script Errors**, scoped to `kitchen`, delivered to email. That covers the errors the runtime itself sees. Nothing yet alerts on a specific `event`, so the webhook rows are worth a glance after any Stripe change.

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
