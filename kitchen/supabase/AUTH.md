# Supabase Auth setup (Kitchen)

Kitchen uses **Supabase Auth** for sign-up, sign-in, and password reset. Prisma `User` rows are synced on first login.

## Dashboard configuration

In [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/_/auth/url-configuration):

| Setting | Value |
|---------|-------|
| **Site URL** | `https://lovethelaus.com/kitchen` |
| **Redirect URLs** | `https://lovethelaus.com/kitchen/auth/callback` |
| | `https://lovethelaus.com/kitchen/reset-password` |
| | `http://localhost:3000/kitchen/auth/callback` |
| | `http://localhost:3000/kitchen/reset-password` |

In **Authentication → Providers → Email**:

- Enable **Email** provider
- Allow email + password sign-in
- Enable **Magic link** (OTP) for passwordless sign-in

Optional: configure Apple and Google providers when ready (UI shows "coming soon" until enabled).

Optional: customize the **Reset password** email template under Email Templates.

## Local env

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # seed/purge scripts only — never in browser

# Demo account (Try demo button + db:seed:demo)
DEMO_USER_EMAIL=demo@lovethelaus.com
DEMO_USER_PASSWORD=your-demo-password
```

## Demo account

After `npm run db:seed:demo`, preview recipes and cookbooks without creating an account:

1. Open `/sign-in` (marketing) or `/kitchen/sign-in`
2. Click **Try demo** — signs in with `DEMO_USER_*` server-side and redirects to recipes

Or sign in manually with the same email and password you set in `DEMO_USER_*`.

**Production:** set `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD` as Wrangler secrets on the Kitchen worker (see [`docs/CLOUDFLARE.md`](../../docs/CLOUDFLARE.md)).

To remove legacy `@laus.family` seed users: `npm run db:purge-seed-users` (once, needs service role key).
