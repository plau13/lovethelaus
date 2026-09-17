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

Sign in with email + password at `/kitchen/sign-in`, or visit `/kitchen/api/auth/demo` directly for local demo testing.

## Database, auth, email, billing

PostgreSQL on **Neon** via **Drizzle**. **Better Auth** for sign-in, sign-up, magic links, and password reset; its `user` table is the app user. **Resend** sends email (magic links, resets, cookbook invites). **Stripe** Checkout + Customer Portal handle the Kitchen Plus subscription. Recipe photos live in **R2**.

**Setup and gotchas:** [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md), [`../docs/CLOUDFLARE.md`](../docs/CLOUDFLARE.md)

**Demo:** `demo@lovethelaus.com` (configurable via `DEMO_USER_EMAIL`) — seed with `npm run db:seed:demo`

## What is in this build

- Home dashboard with recent recipes and cookbooks
- Recipes: search, cookbook filters, Add recipe (type or import from URL)
- Recipe types: cooking, baking, or both with separate instruction sections
- Common ingredient picker when adding recipes
- Cookbooks grouped: yours → shared → public, with search and filters
- Settings: profile, kitchen preferences, account deletion
- Cook mode: `/recipes/[id]/cook` (wake lock + large type)
- URL import: JSON-LD for blogs, oEmbed draft for Instagram/TikTok

Import/Interview routes remain available by URL but are not in the main nav.
