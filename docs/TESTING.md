# Testing playbook

Standard verification for Love the Laus (marketing + Kitchen). Run the **relevant section** after every change — not just the feature you edited.

**Definition of done:** Code/build passes, manual checks for the triggered section complete, results noted in commit/PR (e.g. “Auth matrix: 1–9 pass on prod”).

Related docs: [`BRAND.md`](BRAND.md), [`kitchen/supabase/AUTH.md`](../kitchen/supabase/AUTH.md), [`CLOUDFLARE.md`](CLOUDFLARE.md).

---

## 1. Auth and email

### When to run

Run the **full matrix** if you change any of:

- `kitchen/src/lib/auth.ts`
- `kitchen/src/app/auth/**`, `sign-in/**`, `forgot-password/**`, `reset-password/**`
- `kitchen/src/app/api/auth/**`
- `kitchen/src/components/AuthShell.tsx`, `ResetPasswordForm.tsx`, `AuthRecoveryRedirect.tsx`
- Marketing `src/pages/sign-in*.astro`, `sign-up.astro`, `forgot-password.astro`
- `workers/router/src/index.ts` (Kitchen routing)
- Supabase dashboard URL config or [`kitchen/supabase/AUTH.md`](../kitchen/supabase/AUTH.md)

### Automated checks

```bash
cd kitchen && npm test && npm run build
```

If marketing auth pages changed:

```bash
npm run build:prod && npm run check
```

### Manual matrix

Production base: `https://lovethelaus.com`. Local Kitchen: `http://localhost:3000/kitchen`.

| # | Flow | Marketing | Kitchen | Expected outcome |
|---|------|-----------|---------|------------------|
| 1 | Sign up | `/sign-up` | `/kitchen/sign-up` | Account created → `/kitchen/recipes` |
| 2 | Sign in (password) | `/sign-in` | `/kitchen/sign-in` | Logged in → `/kitchen/recipes` |
| 3 | Sign out | — | User menu → Sign out | Session cleared; `/kitchen/recipes` redirects to sign-in |
| 4 | Forgot password | `/forgot-password` | `/kitchen/forgot-password` | Success message; reset email received |
| 5 | Password recovery | Click email link | — | Lands on `/kitchen/reset-password` (no redirect loop); “Set a new password” form; save → `/kitchen/recipes` |
| 6 | Magic link | `/sign-in/one-time` | `/kitchen/sign-in/one-time` | Check-email screen (form hidden); email link → `/kitchen/recipes` |
| 7 | Auth callback | — | PKCE via email links | Session cookies set; redirects respect `next` and `/kitchen` basePath |
| 8 | Demo login | — | `/kitchen/api/auth/demo` | Demo user → recipes (requires `DEMO_USER_*` secrets) |
| 9 | Invalid API GET | — | GET `/kitchen/api/auth/magic-link` | Redirects to one-time sign-in (no 405) |

### Supabase config checks

- [ ] Site URL: `https://lovethelaus.com/kitchen`
- [ ] Redirect URLs include `/kitchen/auth/callback` and `/kitchen/auth/callback?next=/reset-password`
- [ ] Reset password email template uses `{{ .ConfirmationURL }}`, not `{{ .SiteURL }}`
- [ ] Magic link uses callback URL (see [`AUTH.md`](../kitchen/supabase/AUTH.md))

---

## 2. Marketing site

### When to run

Changes to `src/`, Astro config, marketing styles, or router marketing assets.

### Automated

```bash
npm run build:prod
npm run check
```

### Manual

- [ ] Homepage: Hero, Features, How it works, FAQ render
- [ ] “Open Kitchen” header CTA → `/sign-in`
- [ ] Dark mode toggle on homepage and auth pages
- [ ] Mobile menu opens and links work
- [ ] Favicon visible on `/` and `/sign-in`

---

## 3. Kitchen product

### When to run

Changes to recipes, cookbooks, sharing, or Kitchen UI (non-auth).

### Automated

```bash
cd kitchen && npm test && npm run build
```

### Manual

- [ ] `/kitchen/recipes` — debounced search (no Search button); category, time, cookbook, and difficulty dropdowns; index-card layout with hover metadata; “Add recipe” text visible (white on clay)
- [ ] Add/edit recipe — category, cook time, and difficulty save
- [ ] `/kitchen/cookbooks` — list and detail
- [ ] `/kitchen/loved-ones` — invite and remove access
- [ ] Header nav centered: Home, Recipes, Cookbooks, Loved Ones
- [ ] Favicon on `/kitchen/recipes`

---

## 4. Deploy verification

| What changed | Deploy (from repo root) |
|--------------|-------------------------|
| Marketing / router | `npm run deploy:router` |
| Kitchen only | `cd kitchen && npm run deploy` |
| Both | `npm run deploy:all` |

After deploy, smoke-test production URLs for every section you changed. Auth changes require the full **Section 1** matrix on production.

---

## Quick reference: auth file map

| Flow | Key files |
|------|-----------|
| Sign in/up | `kitchen/src/lib/auth.ts`, `api/auth/sign-in`, `sign-up` |
| Magic link | `api/auth/magic-link`, `sign-in/one-time` |
| Forgot/reset | `requestPasswordReset`, `ResetPasswordForm`, `AuthRecoveryRedirect` |
| Callback | `kitchen/src/app/auth/callback/route.ts` |
| Router | `workers/router/src/index.ts` |
