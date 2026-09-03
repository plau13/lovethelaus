# Supabase Auth setup (Kitchen)

Kitchen uses **Supabase Auth** for sign-up, sign-in, password reset, and magic link. Prisma `User` rows are synced on first login.

After any auth change, run the full **Auth & email matrix** in [`docs/TESTING.md`](../../docs/TESTING.md).

## Dashboard configuration

In [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/_/auth/url-configuration):

| Setting | Value |
|---------|-------|
| **Site URL** | `https://lovethelaus.com/kitchen` |
| **Redirect URLs** | `https://lovethelaus.com/kitchen/auth/callback` |
| | `https://lovethelaus.com/kitchen/auth/callback?next=/reset-password` |
| | `https://lovethelaus.com/kitchen/reset-password` |
| | `http://localhost:3000/kitchen/auth/callback` |
| | `http://localhost:3000/kitchen/auth/callback?next=/reset-password` |
| | `http://localhost:3000/kitchen/reset-password` |

In **Authentication → Providers → Email**:

- Enable **Email** provider
- Allow email + password sign-in
- Enable **Magic link** (OTP) for passwordless sign-in

Optional: configure Apple and Google providers when ready.

## Email templates

Under **Authentication → Email Templates**:

| Template | Must use |
|----------|----------|
| **Reset password** | `{{ .ConfirmationURL }}` — **not** `{{ .SiteURL }}` |
| **Magic link** | `{{ .ConfirmationURL }}` |

If reset email uses `SiteURL`, users land on `/kitchen/#access_token=…` instead of `/kitchen/reset-password` and recovery breaks.

## Auth flows (code)

| Flow | Redirect target |
|------|-----------------|
| Magic link | `${APP_URL}/auth/callback` → `/kitchen/recipes` |
| Password reset | `${APP_URL}/auth/callback?next=/reset-password` → reset form |
| Hash fallback | [`AuthRecoveryRedirect`](../src/components/AuthRecoveryRedirect.tsx) forwards recovery hash to `/reset-password` |

## Local env

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # seed/purge scripts only — never in browser
APP_URL="http://localhost:3000/kitchen"

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

## Verification checklist

Before closing an auth task:

1. All redirect URLs above are whitelisted in Supabase
2. Reset password template uses `ConfirmationURL`
3. Run rows 1–9 in [`docs/TESTING.md`](../../docs/TESTING.md) Auth & email matrix
