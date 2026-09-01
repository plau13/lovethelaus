# Kitchen

Family recipe box. This is the product. The marketing site in the parent folder is Astro-only — do not turn it into the app.

## Run

1. `cd kitchen`
2. Copy `.env.example` to `.env` and set Supabase Postgres URLs:
   - `DATABASE_URL` — pooled connection (port 6543, `?pgbouncer=true`)
   - `DIRECT_URL` — direct connection for migrations (port 5432)
3. `npm install`
4. `npm run db:deploy` — apply migrations
5. `npm run db:seed` — sample family data (Mom, Dad, Alex)
6. `npm run dev` — http://localhost:3000
7. `npm test`

Sign in with email. The magic link is printed on the next screen (no SMTP required in dev).

**Sample sign-in:** use `mom@laus.family` after seeding to see Mom's recipes and cookbooks.

Add to iPhone/iPad Home Screen from Safari (Share → Add to Home Screen).

## Database

PostgreSQL on Supabase via Prisma. Custom magic-link auth (not Supabase Auth). RLS is enabled on all tables; the app connects with Prisma using your database URL.

Supabase JS clients (`@supabase/ssr`) are wired for Data API access and session refresh:

```typescript
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

const supabase = createClient(await cookies());
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (see `.env.example`).

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
