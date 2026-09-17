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
npx wrangler secret put OPENAI_API_KEY
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

`NEXT_PUBLIC_ADSENSE_*` and `NEXT_PUBLIC_GA_ID` are compiled into the client bundle. Set them in `kitchen/.env` on the machine that runs `npm run deploy`; they are not Worker secrets and changing them requires a rebuild. See [`ADS.md`](ADS.md).

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

| Secret                                 | Sensitive?         | Notes                                                 |
| -------------------------------------- | ------------------ | ----------------------------------------------------- |
| `DATABASE_URL`                         | **Yes**            | Neon pooled connection string; never in repo          |
| `BETTER_AUTH_SECRET`                   | **Yes**            | Signs session cookies; rotating it signs everyone out |
| `RESEND_API_KEY`                       | **Yes**            | Transactional email                                   |
| `STRIPE_SECRET_KEY`                    | **Yes**            | Server-side Stripe API                                |
| `STRIPE_WEBHOOK_SECRET`                | **Yes**            | Verifies webhook signatures                           |
| `DEMO_USER_EMAIL`                      | No                 | Demo sign-in email (Try demo)                         |
| `DEMO_USER_PASSWORD`                   | **Yes**            | Demo account password; set before `db:seed:demo`      |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | **Yes** (optional) | AI structuring of imported drafts                     |

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

## Deploy everything

From repo root:

```bash
PUBLIC_KITCHEN_URL=https://lovethelaus.com/kitchen npm run deploy:all
```

Or step by step:

```bash
PUBLIC_KITCHEN_URL=https://lovethelaus.com/kitchen npm run build
cd kitchen && npm run deploy && cd ..
wrangler deploy --config workers/router/wrangler.jsonc
```

The router Worker attaches `lovethelaus.com` as a custom domain on deploy.

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
