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
cp .env.example .env   # set Supabase DATABASE_URL + DIRECT_URL
npm install
npm run db:deploy
npm run db:seed
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
