# Supabase setup for Kitchen

Kitchen uses **PostgreSQL on Supabase** via Prisma and **Supabase Auth** for sign-in. See [`AUTH.md`](./AUTH.md) for dashboard setup.

Sign in at `/kitchen/sign-in` or `lovethelaus.com/sign-in` with email + password.

Project URL (from your dashboard): `https://rwfyzlntdlrjvkyzuuzy.supabase.co`

---

## Option A — Recommended (terminal)

1. In [Supabase Dashboard → Project Settings → Database](https://supabase.com/dashboard/project/rwfyzlntdlrjvkyzuuzy/settings/database), copy:
   - **Transaction pooler** URI → `DATABASE_URL` (port **6543**, add `?pgbouncer=true`)
   - **Direct connection** URI → `DIRECT_URL` (port **5432**)

2. Put both in `kitchen/.env` — **only one** `DATABASE_URL` line (remove any old `file:./dev.db` SQLite value):

```env
DATABASE_URL="postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"
APP_URL="http://localhost:3000"
```

3. Run from `kitchen/`:

```bash
npm run db:deploy   # creates all tables + RLS
npm run db:seed:demo   # demo account + 8 recipes + cookbooks
npm run dev
```

4. Open http://localhost:3000/kitchen/sign-in and click **Try demo**, or sign in with `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD`.

See [`AUTH.md`](./AUTH.md) for Supabase Auth dashboard settings and demo env vars.

---

## Option B — Supabase SQL Editor

Run these **in order** in [SQL Editor](https://supabase.com/dashboard/project/rwfyzlntdlrjvkyzuuzy/sql/new):

| File | Purpose |
|------|---------|
| [`01_schema.sql`](./01_schema.sql) | All Kitchen tables, indexes, foreign keys, RLS |
| [`02_storage.sql`](./02_storage.sql) | Private `recipe-photos` bucket |
| [`03_seed.sql`](./03_seed.sql) | **Deprecated** — use `npm run db:seed:demo` instead |

After running SQL manually, mark the Prisma migration as applied (so `db:deploy` does not re-run):

```bash
cd kitchen
npx prisma migrate resolve --applied 20260901152000_init
```

---

## Demo account

| Email | Display name | Notes |
|-------|--------------|-------|
| `demo@lovethelaus.com` | Demo Kitchen | Owner of 8 sample recipes + 3 cookbooks |

**How to sign in**

1. Go to `/kitchen/sign-in` (or `lovethelaus.com/sign-in`)
2. Click **Try demo**, or sign in with `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` after `npm run db:seed:demo`

To remove legacy `@laus.family` users: `npm run db:purge-seed-users` (once).

---

## Storage

Bucket `recipe-photos` (private, 1 MB, jpg/png/webp) is created by `02_storage.sql`. Recipe uploads still save to `public/uploads/` locally until we wire Supabase Storage in the app.

---

## Security

- RLS is **enabled** on all app tables with **no policies** for `anon` / `authenticated` — the Data API cannot read them.
- The Next.js app uses the **database connection string** (Prisma), which uses the `postgres` role and bypasses RLS.
- Do **not** expose the database password or `service_role` key in the browser.

---

## Verify

```bash
cd kitchen
npx prisma db execute --stdin <<< 'SELECT email, name FROM "User";'
```

You should see `demo@lovethelaus.com` after `db:seed:demo`.
