# Love the Laus

Marketing site (Astro, this folder) + family recipe app ([kitchen/](kitchen/)).

## Marketing site

```bash
cp .env.example .env   # optional: PUBLIC_KITCHEN_URL
npm run dev            # http://localhost:4321
npm run build
npm run check
```

Set `PUBLIC_KITCHEN_URL` to where Kitchen runs (default `http://localhost:3000`). The landing page **Open Kitchen** buttons use this URL.

## Kitchen app (the product)

```bash
cd kitchen
cp .env.example .env   # set Neon DATABASE_URL + DATABASE_URL_UNPOOLED, BETTER_AUTH_SECRET
npm install
npm run db:migrate
npm run db:seed:demo
npm run dev            # http://localhost:3000
```

See [kitchen/README.md](kitchen/README.md) for sign-in, recipes, cookbooks, and import.

## What lives where

| Path                               | Purpose                                      |
| ---------------------------------- | -------------------------------------------- |
| `src/pages/index.astro`            | Love the Laus landing page                   |
| `src/pages/privacy.md`, `terms.md` | Legal pages                                  |
| `kitchen/`                         | Next.js recipe app — do not merge into Astro |

Old AstroWind demo routes (`homes/`, `landing/`, blog) were removed.

## Docs

- [`docs/GAP-ANALYSIS.md`](docs/GAP-ANALYSIS.md) — where the product stands vs. the market
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Neon + Drizzle + Better Auth + Resend + Stripe + R2
- [`docs/ADS.md`](docs/ADS.md) — public-pages-only ad strategy
- [`docs/HERITAGE.md`](docs/HERITAGE.md) — the heritage & story differentiation
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — phases
- [`docs/CLOUDFLARE.md`](docs/CLOUDFLARE.md), [`docs/TESTING.md`](docs/TESTING.md), [`docs/BRAND.md`](docs/BRAND.md)
