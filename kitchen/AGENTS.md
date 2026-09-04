<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Kitchen app

Family recipe product. Lives in `/kitchen`, not the Astro marketing site.

**Agent execution:** Run all terminal commands yourself (see root [`AGENTS.md`](../AGENTS.md#agent-execution)). **Commit and deploy after each task** unless the user opts out. Only ask when blocked (e.g. missing Supabase secrets in `.env`).

- PostgreSQL (Supabase) via Prisma (`prisma/schema.prisma`)
- Supabase Auth in `src/lib/auth.ts`
- Demo seed: `npm run db:seed:demo` (`demo@lovethelaus.com` + sample recipes)
- Purge legacy seed users: `npm run db:purge-seed-users`
- Tests: `npm test` (permissions, JSON-LD, social import)
- Cook mode: `/recipes/[id]/cook` (wake lock + large type)
- Nav: Home, Recipes, Cookbooks + user menu (Settings)
- Brand: [`docs/BRAND.md`](../docs/BRAND.md)
- Testing: [`docs/TESTING.md`](../docs/TESTING.md) — run full Auth matrix when touching auth/email
- Supabase: [`supabase/AUTH.md`](supabase/AUTH.md)
