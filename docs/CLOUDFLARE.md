# Deploy Love the Laus on Cloudflare

Single domain: **`lovethelaus.com`**

| Path | App |
|------|-----|
| `/` | Marketing (Astro static) |
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

From `kitchen/`:

```bash
npx wrangler secret put APP_URL           # https://lovethelaus.com/kitchen
npx wrangler secret put DATABASE_URL
npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
npx wrangler secret put NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put DEMO_USER_EMAIL      # demo@lovethelaus.com
npx wrangler secret put DEMO_USER_PASSWORD   # same value used for db:seed:demo
```

Optional Hyperdrive: add to `kitchen/wrangler.jsonc` after creating in dashboard.

## Secrets & environment variables

### Where values live

| Location | Used for | Committed to git? | Encrypted at rest? |
|----------|----------|-------------------|--------------------|
| `kitchen/.env` | Local dev (Prisma, Next) | **No** (`.gitignore`) | Your machine only |
| `kitchen/.dev.vars` | Local `wrangler dev` / OpenNext preview | **No** (`.gitignore`) | Your machine only |
| **Wrangler secrets** | Production Kitchen Worker | **No** — stored in Cloudflare | **Yes** (Cloudflare encrypts; never returned after upload) |
| `wrangler.jsonc` `vars` | Non-sensitive config only | Yes | N/A (plain text in repo) |
| Build-time env (`PUBLIC_KITCHEN_URL`) | Marketing HTML at build | No secrets — baked into static `dist/` | N/A |

### Production Kitchen secrets (current)

Set via `npx wrangler secret put <NAME>` from `kitchen/`:

| Secret | Sensitive? | Notes |
|--------|------------|-------|
| `DATABASE_URL` | **Yes** | Supabase pooler password; never in repo |
| `APP_URL` | No | Public URL (`https://lovethelaus.com/kitchen`) |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Low | Client-side key; RLS protects data |
| `DEMO_USER_EMAIL` | No | Demo sign-in email (Try demo) |
| `DEMO_USER_PASSWORD` | **Yes** | Demo account password; set before `db:seed:demo` |

List what's configured (names only, not values):

```bash
cd kitchen && npx wrangler secret list
```

Rotate a secret: run `wrangler secret put <NAME>` again with the new value.

### What is NOT secret

- `NEXT_PUBLIC_*` vars are embedded in client bundles by design.
- Marketing `PUBLIC_KITCHEN_URL` is compiled into static HTML — that's fine; it's a public URL.
- The **router Worker** (`lovethelaus`) has no secrets — it only routes traffic and serves public static files.

### What to never commit

- `kitchen/.env`, `kitchen/.env.local`, `kitchen/.dev.vars`
- Root `.env`
- Any file containing `DATABASE_URL`, `DIRECT_URL`, or API keys

Only `.env.example` and `.dev.vars.example` (placeholders) belong in git.

### Local vs production

- **Local:** copy `kitchen/.env.example` → `kitchen/.env` with your Supabase credentials.
- **Production:** use Wrangler secrets only; do not upload `.env` to Cloudflare.
- **Migrations:** run locally/CI with `DIRECT_URL` — do not put `DIRECT_URL` in Worker secrets unless you have a specific need.

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

Run against Supabase (not from Workers):

```bash
cd kitchen && npm run db:deploy
```

## Verify

- `https://lovethelaus.com` — landing page
- `https://lovethelaus.com/kitchen/login` — Kitchen auth
- Open Kitchen CTA links to `/kitchen`
