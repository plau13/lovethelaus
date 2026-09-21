# Kitchen

Family recipe box. This is the product. The marketing site in the parent folder is Astro-only — do not turn it into the app.

## Run

1. `cd kitchen`
2. Copy `.env.example` to `.env` and set the Neon URLs plus `BETTER_AUTH_SECRET` (see [`../docs/CLOUDFLARE.md`](../docs/CLOUDFLARE.md))
3. `npm install`
4. `npm run db:migrate` — apply Drizzle migrations
5. `npm run db:seed:demo` — demo account + sample recipes (needs `DEMO_USER_PASSWORD`)
6. `npm run dev` — http://localhost:3000/kitchen
7. `npm test`
8. `npm run smoke [url]` — checks a **deployed** site, not the dev server

Sign in with email + password at `/kitchen/sign-in`, or visit `/kitchen/api/auth/demo` directly for local demo testing.

## Database, auth, email, billing

PostgreSQL on **Neon** via **Drizzle**. **Better Auth** for sign-in, sign-up, magic links, and password reset; its `user` table is the app user. **Resend** sends email (magic links, resets, cookbook invites). **Stripe** Checkout + Customer Portal handle the Kitchen Plus subscription. Recipe photos live in **R2**.

**Setup and gotchas:** [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md), [`../docs/CLOUDFLARE.md`](../docs/CLOUDFLARE.md)

**Demo:** `demo@lovethelaus.com` (configurable via `DEMO_USER_EMAIL`) — seed with `npm run db:seed:demo`

## What is in this build

- Home dashboard with recent recipes and cookbooks
- Recipes: Postgres full-text search, tag and favorites filters, pagination, Add recipe (type or import from URL)
- Recipe types: cooking, baking, or both with separate instruction sections
- Common ingredient picker when adding recipes
- Photo gallery with a chosen cover (`coverPhotoId`), never an implied `photos[0]`
- Cookbooks grouped: yours → shared → public, with search and filters
- Heritage: people, provenance and lineage, "I made this" memories, the `/family` timeline, scanned cards and voice memos, the print-ready book
- Onboarding: four preferences that each configure the app — recipe box name, default servings, units, new-cookbook sharing
- Settings: profile plus those same four preferences, validated by the same module; account deletion by email
- Cook mode: `/recipes/[id]/cook` (wake lock + large type)
- URL import: JSON-LD for blogs, oEmbed draft for Instagram/TikTok
- Billing: Stripe Checkout and Customer Portal for Kitchen Plus

`/import` and `/interview` are reachable by URL but not in the main nav. `/interview` is a standalone long-form questionnaire writing to `interview_response` — it is **not** the onboarding flow, which no longer asks open-ended questions.

## Onboarding and preferences

Onboarding collects four things, all editable later in Settings. Both forms validate through `src/lib/kitchen-prefs.ts` so they cannot drift apart. Each preference has to change behaviour to earn its place — the previous onboarding stored nine answers nothing read. See [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md#onboarding-and-preferences).

One caveat worth knowing: `preferredUnits` is collected and stored but **nothing reads it yet**. It gets a job when unit conversion ships.

## When sign-in fails

Better Auth shows the same message for three different causes. [`../docs/AUTH.md`](../docs/AUTH.md) has the table that maps each Worker log line to the real cause and its fix — read it before guessing at passwords.
