# Supabase setup for Kitchen

Kitchen uses **PostgreSQL on Supabase** via Prisma. Sign-in is **magic-link** (app `User` table), not Supabase Auth — you log in at `/login` with the emails below; the link appears on screen (no SMTP in dev).

Project URL (from your dashboard): `https://rwfyzlntdlrjvkyzuuzy.supabase.co`

---

## Option A — Recommended (terminal)

1. In [Supabase Dashboard → Project Settings → Database](https://supabase.com/dashboard/project/rwfyzlntdlrjvkyzuuzy/settings/database), copy:
   - **Transaction pooler** URI → `DATABASE_URL` (port **6543**, add `?pgbouncer=true`)
   - **Direct connection** URI → `DIRECT_URL` (port **5432**)

2. Put both in `kitchen/.env` (replace the old SQLite `file:./dev.db` value):

```env
DATABASE_URL="postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"
APP_URL="http://localhost:3000"
```

3. Run from `kitchen/`:

```bash
npm run db:deploy   # creates all tables + RLS
npm run db:seed     # Mom, Dad, Alex + 8 recipes + cookbooks
npm run dev
```

4. Open http://localhost:3000/login and sign in with any seed email below.

---

## Option B — Supabase SQL Editor

Run these **in order** in [SQL Editor](https://supabase.com/dashboard/project/rwfyzlntdlrjvkyzuuzy/sql/new):

| File | Purpose |
|------|---------|
| [`01_schema.sql`](./01_schema.sql) | All Kitchen tables, indexes, foreign keys, RLS |
| [`02_storage.sql`](./02_storage.sql) | Private `recipe-photos` bucket |
| [`03_seed.sql`](./03_seed.sql) | Family users, cookbooks, sample recipes |

After running SQL manually, mark the Prisma migration as applied (so `db:deploy` does not re-run):

```bash
cd kitchen
npx prisma migrate resolve --applied 20260901152000_init
```

---

## Seed login emails

| Email | Display name | Notes |
|-------|--------------|-------|
| `mom@laus.family` | Mom | Owner; default cookbook + most recipes |
| `dad@laus.family` | Dad | Editor on **Family Dinners** |
| `alex@laus.family` | Alex | Viewer on **Family Dinners** |

**How to sign in**

1. Go to `/login`
2. Enter email (e.g. `mom@laus.family`) and name (e.g. `Mom`)
3. Submit — the **magic link URL is shown on the page** (dev mode, no email sent)
4. Click the link → signed in

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

You should see the three `@laus.family` users after seeding.
