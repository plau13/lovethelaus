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
npm run dev            # http://localhost:3000/kitchen
npm test
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

Start here if you are new to the repo — human or agent:

| Doc                                            | What it answers                                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [`AGENTS.md`](AGENTS.md)                       | How to work in this repo: run commands yourself, commit, deploy                              |
| [`kitchen/AGENTS.md`](kitchen/AGENTS.md)       | The same, for the product — plus the rules that are easy to break                            |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | **Why the stack is what it is**, request flows, code map, and the rules that keep it working |
| [`docs/AUTH.md`](docs/AUTH.md)                 | How sign-in works, and how to debug it when it fails                                         |
| [`docs/CREDENTIALS.md`](docs/CREDENTIALS.md)   | Every value the app needs and where to get it                                                |
| [`docs/CLOUDFLARE.md`](docs/CLOUDFLARE.md)     | Deploy runbook, secrets, migrations, alerts                                                  |
| [`docs/TESTING.md`](docs/TESTING.md)           | What to verify after a change, by area                                                       |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)           | Phases and what is actually done — the live status view                                      |
| [`docs/GAP-ANALYSIS.md`](docs/GAP-ANALYSIS.md) | Dated audit vs. the market; why the roadmap exists                                           |
| [`docs/HERITAGE.md`](docs/HERITAGE.md)         | The heritage & story differentiation                                                         |
| [`docs/ADS.md`](docs/ADS.md)                   | Public-pages-only ad strategy                                                                |
| [`docs/BRAND.md`](docs/BRAND.md)               | Palette, type, and voice                                                                     |

## Deploying

Both Workers build and deploy themselves from Workers Builds, one project each, so **merging to `main` is the deploy** — `kitchen` from `kitchen/`, `lovethelaus` from the repo root. Database migrations never ride a deploy: run Actions → **Database**. Verify with Actions → **Smoke**. Details in [`docs/CLOUDFLARE.md`](docs/CLOUDFLARE.md).
