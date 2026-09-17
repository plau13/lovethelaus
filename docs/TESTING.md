# Testing playbook

Standard verification for Love the Laus (marketing + Kitchen). Run the **relevant section** after every change — not just the feature you edited.

**Definition of done:** Code/build passes, manual checks for the triggered section complete, results noted in commit/PR (e.g. “Auth matrix: 1–9 pass on prod”).

Related docs: [`BRAND.md`](BRAND.md), [`ARCHITECTURE.md`](ARCHITECTURE.md), [`CLOUDFLARE.md`](CLOUDFLARE.md).

---

## 1. Auth and email

### When to run

Run the **full matrix** if you change any of:

- `kitchen/src/lib/auth.ts`, `kitchen/src/lib/better-auth.ts`, `kitchen/src/lib/post-auth.ts`, `kitchen/src/proxy.ts`
- `kitchen/src/app/auth/**`, `sign-in/**`, `forgot-password/**`, `reset-password/**`
- `kitchen/src/app/api/auth/**`
- `kitchen/src/components/AuthShell.tsx`, `ResetPasswordForm.tsx`
- `kitchen/src/lib/email.ts`, `kitchen/src/lib/email-templates.ts`
- Marketing `src/pages/sign-in*.astro`, `sign-up.astro`, `forgot-password.astro`
- `workers/router/src/index.ts` (Kitchen routing)
- `APP_URL`, `BETTER_AUTH_SECRET`, Resend or Stripe configuration

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
| 5 | Password recovery | Click email link | — | Lands on `/kitchen/reset-password?token=…` with the “Set a new password” form visible; save → `/kitchen/sign-in?reset=1`; expired link shows “invalid or expired” |
| 6 | Magic link | `/sign-in/one-time` | `/kitchen/sign-in/one-time` | Check-email screen (form hidden); email link → `/kitchen/recipes` (or onboarding for a new account) |
| 7 | Auth callback | — | `/kitchen/auth/callback?returnTo=…` | Honours `returnTo` (site-relative only) and onboarding state; `/kitchen` basePath respected |
| 8 | Demo login | — | `/kitchen/api/auth/demo` | Demo user → recipes (requires `DEMO_USER_*` secrets) |
| 9 | Invalid API GET | — | GET `/kitchen/api/auth/magic-link` | Redirects to one-time sign-in (no 405) |
| 10 | Cookbook invite by email (new address) | — | Cookbook → Share → add an email with no account | Invite email arrives; sign-up with that email lands in the cookbook as a member |
| 11 | Protected route, signed out | — | `/kitchen/recipes` | Redirects to `/kitchen/sign-in?returnTo=/recipes`; after sign-in lands back on recipes |
| 12 | Public cookbook, signed out | — | `/kitchen/c/<public-slug>` | Renders with no session cookie set and no `session` query in Neon's query stats |

### Config checks

- [ ] `APP_URL` = `https://lovethelaus.com/kitchen` (Better Auth `baseURL` is its origin, `basePath` is `/kitchen/api/auth`)
- [ ] `BETTER_AUTH_SECRET` set; cookies appear as `__Secure-kitchen.session_token` and `__Secure-kitchen.session_data` with `Path=/`
- [ ] Resend domain verified; `EMAIL_FROM` uses it
- [ ] Emails contain links that start with `https://lovethelaus.com/kitchen/api/auth/`

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

- [ ] `/kitchen` — search redirects to `/kitchen/recipes?q=…`; recent recipes and cookbooks as white list cards with metadata
- [ ] `/kitchen/recipes` — filters above search; white list cards with category · cook time · difficulty · tags; “Add recipe” white on clay
- [ ] Recipe detail — visible back arrow on “All recipes”; “All recipes” and cook mode on one line; bordered cook-mode rectangle (grey off, green on); favorite heart toggles instantly; servings stepper scales ingredient quantities (best-effort); ingredients/instructions in white section cards; hero photo or edit placeholder; toolbar icons centered (Heart · Share · Download · ⋯); cook mode uses scaled ingredients with checkboxes; Share modal; Edit in ⋯ when editable
- [ ] Navigation — Recipes ↔ Cookbooks ↔ recipe detail shows loading skeleton briefly (not a blank stall)
- [ ] `/kitchen/cookbooks` — cookbook list cards (visibility · recipe count · role); favorites section when starred; cookbook detail toolbar (heart · share · download · ⋯ settings)
- [ ] Cookbook share modal — email pills, invite link, member list; `/kitchen/loved-ones` redirects to cookbooks
- [ ] Settings — first/last name, units, onboarding answers (read-only), email support for account deletion (no self-serve delete)
- [ ] New user sign-up → `/kitchen/onboarding` → recipes; answers visible in Settings
- [ ] Add/edit recipe — category, cook time, and difficulty save
- [ ] Header nav centered: Home, Recipes, Cookbooks
- [ ] Favicon on `/kitchen/recipes`

---

## 4. Billing

### When to run

Changes to `kitchen/src/lib/stripe.ts`, `billing.ts`, `src/app/actions/billing.ts`, `src/app/api/stripe/webhook/route.ts`, or the Settings Plan section.

### Manual (Stripe test mode)

- [ ] Settings → Plan shows “Upgrade to Kitchen Plus” for a free user
- [ ] Upgrade → Stripe Checkout → pay with `4242 4242 4242 4242` → back on `/kitchen/settings?checkout=success`; tier shows Plus within a few seconds (webhook)
- [ ] “Manage billing” opens the Customer Portal; cancel → tier returns to free (immediately if cancelled now, else at period end)
- [ ] `stripe trigger customer.subscription.deleted` flips the tier back to free
- [ ] Webhook with a bad signature returns 400

---

## 5. Deploy verification

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
| Better Auth instance | `kitchen/src/lib/better-auth.ts`, handler `api/auth/[...all]` |
| Sign in/up | `kitchen/src/lib/auth.ts`, `api/auth/sign-in`, `sign-up`, `actions/auth.ts` |
| Magic link | `api/auth/magic-link`, `sign-in/one-time` |
| Forgot/reset | `requestPasswordReset`, `ResetPasswordForm`, `resetPasswordAction` |
| Callback / redirects | `kitchen/src/app/auth/callback/route.ts`, `kitchen/src/lib/post-auth.ts` |
| Route guard | `kitchen/src/proxy.ts` |
| Email | `kitchen/src/lib/email.ts`, `email-templates.ts` |
| Router | `workers/router/src/index.ts` |
