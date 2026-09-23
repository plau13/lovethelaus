# Testing playbook

Standard verification for Love the Laus (marketing + Kitchen). Run the **relevant section** after every change — not just the feature you edited.

**Definition of done:** Code/build passes, manual checks for the triggered section complete, results noted in commit/PR (e.g. “Auth matrix: 1–9 pass on prod”).

Related docs: [`BRAND.md`](BRAND.md), [`ARCHITECTURE.md`](ARCHITECTURE.md), [`AUTH.md`](AUTH.md), [`CLOUDFLARE.md`](CLOUDFLARE.md).

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

| #   | Flow                                   | Marketing           | Kitchen                                         | Expected outcome                                                                                                                                                  |
| --- | -------------------------------------- | ------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Sign up                                | `/sign-up`          | `/kitchen/sign-up`                              | Account created → `/kitchen/recipes`                                                                                                                              |
| 2   | Sign in (password)                     | `/sign-in`          | `/kitchen/sign-in`                              | Logged in → `/kitchen/recipes`                                                                                                                                    |
| 3   | Sign out                               | —                   | User menu → Sign out                            | Session cleared; `/kitchen/recipes` redirects to sign-in                                                                                                          |
| 4   | Forgot password                        | `/forgot-password`  | `/kitchen/forgot-password`                      | Success message; reset email received                                                                                                                             |
| 5   | Password recovery                      | Click email link    | —                                               | Lands on `/kitchen/reset-password?token=…` with the “Set a new password” form visible; save → `/kitchen/sign-in?reset=1`; expired link shows “invalid or expired” |
| 6   | Magic link                             | `/sign-in/one-time` | `/kitchen/sign-in/one-time`                     | Check-email screen (form hidden); email link → `/kitchen/recipes` (or onboarding for a new account)                                                               |
| 7   | Auth callback                          | —                   | `/kitchen/auth/callback?returnTo=…`             | Honours `returnTo` (site-relative only) and onboarding state; `/kitchen` basePath respected                                                                       |
| 8   | Demo login (owner QA only)             | —                   | `/kitchen/api/auth/demo?key=<DEMO_ROUTE_SECRET>`  | Not linked in the UI. Requires `DEMO_ROUTE_SECRET` + `DEMO_USER_PASSWORD`; redirects to onboarding or recipes via `/kitchen/auth/callback`                          |
| 9   | Invalid API GET                        | —                   | GET `/kitchen/api/auth/magic-link`              | Redirects to one-time sign-in (no 405)                                                                                                                            |
| 10  | Cookbook invite by email (new address) | —                   | Cookbook → Share → add an email with no account | Invite email arrives; sign-up with that email lands in the cookbook as a member                                                                                   |
| 11  | Protected route, signed out            | —                   | `/kitchen/recipes`                              | Redirects to `/kitchen/sign-in?returnTo=/recipes`; after sign-in lands back on recipes                                                                            |
| 12  | Public cookbook, signed out            | —                   | `/kitchen/c/<public-slug>`                      | Renders with no session cookie set and no `session` query in Neon's query stats                                                                                   |

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
- [ ] Settings — first/last name, all four kitchen preferences (recipe box name, default servings, units, new-cookbook sharing) present, editable, and showing the stored values; email support for account deletion (no self-serve delete)
- [ ] Add/edit recipe — category, cook time, and difficulty save
- [ ] Header nav centered: Home, Recipes, Cookbooks
- [ ] Favicon on `/kitchen/recipes`

---

## 3b. Onboarding and preferences

### When to run

Changes to `src/lib/kitchen-prefs.ts`, the onboarding page or action, the Settings preferences form, or anything reading `defaultServings` / `preferredUnits` / `defaultCookbookVisibility`.

### Automated

```bash
cd kitchen && npm test          # kitchen-prefs.test.ts covers the validator
```

### Manual — on a genuinely new account

The point of this matrix is that a preference must **change something**. A field that saves but alters no behaviour is the defect it is written to catch.

- [ ] Sign up → lands on `/kitchen/onboarding` showing **four** preferences (not a list of open-ended questions)
- [ ] **"Finish setup" lands on `/kitchen/recipes` and stays there.** Bouncing back to the form is the stale-session regression — see [`AUTH.md`](AUTH.md); check Workers Logs for `onboarding.stale_session`
- [ ] New recipe → servings prefilled with the chosen number
- [ ] New cookbook → visibility select defaults to the chosen sharing setting
- [ ] Cookbooks page → the default cookbook carries the chosen recipe box name, not "My recipes"
- [ ] Settings → all four show the chosen values; changing one and saving takes effect immediately (the session cache is refreshed, not waited out)
- [ ] Revisiting `/kitchen/onboarding` after completing it redirects to recipes rather than re-asking

Known and intentional: **`preferredUnits` currently changes nothing.** It is stored and echoed back but has no reader until unit conversion ships, so there is no behaviour to assert for it yet.

---

## 3c. Error logging and user-facing failures

### When to run

Changes to `kitchen/src/lib/{errors,log,sentry,action-result,route-helpers}.ts`, `components/{FormAlert,QueryFlash}.tsx`, `app/error.tsx`, `global-error.tsx`, server actions that call `redirectActionError` / `actionFail` / `reportError`, or Sentry config.

### Automated

```bash
cd kitchen && npm test && npm run build:cf
```

`errors.test.ts` covers message sanitization (DB errors must not reach the browser). `build:cf` verifies the OpenNext + Sentry OTEL patch (`postinstall` → `patch-opennext-otel.mjs`) — a failure on `@opentelemetry/api` during middleware bundling means the patch did not run.

### Manual

- [ ] Trigger a validation error (e.g. import with an empty URL) → lands with `?error=` and a readable message in a red alert, not a stack trace
- [ ] Settings → save with an invalid value if applicable → same pattern
- [ ] `/recipes` and `/cookbooks` list pages show `QueryFlash` when redirected with `?error=` (fallback targets for photo/media/collaborator failures)
- [ ] Cookbook share dialog → "Create invite link" failure shows an inline alert, not a silent spinner stop
- [ ] Auth callback with no session → sign-in page shows a readable message, not the literal string `auth`
- [ ] With `SENTRY_DSN` unset locally, confirm Workers Logs (or dev console) still shows a JSON line with the matching `event` name
- [ ] With `SENTRY_DSN` set, confirm the same failure creates a Sentry issue tagged with that event
- [ ] Auth failures (wrong password) log `auth.sign_in_failed` at **warn** only — not Sentry
- [ ] Stripe webhook handler failure returns 500 and logs `stripe.webhook.handler_failed`; bad signature returns 400 and does **not** create a Sentry issue
- [ ] Client: with `NEXT_PUBLIC_SENTRY_DSN` in the build, trigger a client error boundary (or check Sentry for `app.error_boundary` / `public.error_boundary` tags after a real incident)
- [ ] Production build includes client DSN: view page source or network tab — Sentry ingest requests only when DSN is baked in

Event names are catalogued in [`CLOUDFLARE.md`](CLOUDFLARE.md#event-catalog).

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

## 5. Public pages, SEO, and ads

### When to run

Changes under `kitchen/src/app/(public)/`, `components/PublicShell.tsx`, `components/ads/*`, `components/analytics/*`, `lib/public-recipes.ts`, `lib/public-seo.ts`, `app/sitemap.ts`, `app/robots.ts`, `next.config.ts` headers, root `public/ads.txt` / `robots.txt`, or `src/pages/privacy.md`.

### Manual (signed out, private window)

- [ ] `/kitchen/explore` renders with the public header (Kitchen · Explore · Open Kitchen), category pills, cards with photo or placeholder, pagination when > 24 recipes
- [ ] `/kitchen/c/<public slug>` shows the card grid; `/kitchen/r/<slug>` shows the recipe with Ingredients / Instructions cards and the “Keep this one in your own Kitchen” CTA
- [ ] `view-source` on `/kitchen/r/<slug>`: `<script type="application/ld+json">` with `"@type":"Recipe"`, `og:title`, `og:image` (when a photo exists), `<link rel="canonical">`; paste the URL into Google's Rich Results Test
- [ ] A recipe only in an **unlisted** cookbook: page renders, `<meta name="robots" content="noindex">`, no ad frames, not in `/kitchen/sitemap.xml`
- [ ] `/kitchen/sitemap.xml` lists explore, categories, public cookbooks, public recipes only; `/kitchen/robots.txt` allows `/kitchen/explore`, `/kitchen/c/`, `/kitchen/r/` and disallows the rest; `https://lovethelaus.com/robots.txt` has the `Sitemap:` line; `https://lovethelaus.com/ads.txt` serves
- [ ] With `NEXT_PUBLIC_ADSENSE_CLIENT` set at build: `<ins class="adsbygoogle">` in the desktop rail (≥ 1024 px) and in-content/anchor on mobile; without it, no ad markup at all
- [ ] Response headers on any Kitchen page include `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`
- [ ] Signed in, the app pages (`/kitchen/recipes` …) are unchanged and carry no ad markup

---

## 6. Heritage (people, provenance, memories, family)

### When to run

Changes to `kitchen/src/lib/{people,memories,heritage}.ts`, `components/{ProvenanceBlock,ProvenanceFields,MadeThisButton,MemoriesSection,PersonForm}.tsx`, `src/app/(app)/family/**`, `actions/people.ts`, or the heritage fields in `actions/recipes.ts` / `lib/recipes.ts`.

### Manual

- [ ] Editor → “Where it comes from” → “+ Add someone” adds a person inline and selects them; save; the recipe page shows the provenance card with the person linked to `/family/people/<id>`
- [ ] First-made year rejects `1799` and next year; occasion suggestions appear; story renders with line breaks
- [ ] Set “Adapted from” to another recipe; both pages show the lineage (Adapted from / Adapted by); a recipe cannot be adapted from itself
- [ ] “I made this” on the recipe page and at the bottom of cook mode records a dated entry; summary line updates (“Made once · last by …”); only the author sees Remove
- [ ] `/family` lists people with recipe counts and the timeline (memories + origins by year); `/loved-ones` redirects to `/family`
- [ ] Person page lists their recipes; Edit and Remove work; removing clears the origin on the recipes but keeps the recipes
- [ ] Cookbook settings save Family name and Dedication; the cookbook page and `/kitchen/c/<slug>` show the dedication
- [ ] Public `/kitchen/r/<slug>` shows the provenance line and story; nothing about people leaks beyond name and relationship
- [ ] Header nav shows Home · Recipes · Cookbooks · Family

---

## 7. Heritage media (scans, voice, transcription, the book)

### When to run

Changes to `kitchen/src/lib/{media,media-storage,media-limits,transcribe-scan,anthropic,book}.ts`, `src/components/media/**`, `src/components/book/**`, `src/app/api/recipe-media/**`, `src/app/actions/{media,transcribe}.ts`, or `src/app/(app)/cookbooks/[id]/book/**`.

### Manual

- [ ] On a phone, “Add the original card” opens the camera; the uploaded scan appears beside the typed recipe with its caption
- [ ] A 6MB card photo is rejected with the size message; a PDF is rejected with the type message
- [ ] Record a voice memo in Chrome and in Safari; both save and play back on the recipe page
- [ ] Scrub the memo partway through in Safari; playback continues from the new position (proves `Range` → `206`)
- [ ] Cook mode shows “Hear how they made it” above the ingredients and plays the memo
- [ ] A free account is refused a second scan and a second memo on the same recipe with the Kitchen Plus nudge; a Plus account is not
- [ ] With `ANTHROPIC_API_KEY` set, “Read this card” fills a transcript; “Use as ingredients and steps” writes the recipe and leaves an undoable revision
- [ ] “Use as ingredients and steps” refuses when the recipe already has ingredients or steps, and says why
- [ ] Without `ANTHROPIC_API_KEY`, the recipe page hides “Read this card” and an import still saves the raw draft
- [ ] A logged-out visitor sees the scan and hears the memo on a public `/kitchen/r/<slug>`; a private recipe’s media returns 403
- [ ] `/kitchen/cookbooks/<id>/book` nudges a free account to upgrade and renders for Plus
- [ ] Print preview of the book shows the cover, the contributors page, and one recipe per page, with chapters ordered by occasion and “Other recipes” last

---

## 8. Search, filters, and pagination

### When to run

Changes to `kitchen/src/lib/{recipes,cookbooks,pagination,search-terms,recipe-filters}.ts`, `src/components/{Pager,RecipeFiltersBar,RecipeListItem}.tsx`, the recipes or cookbooks index pages, or the `recipe.search_vector` column.

### Manual

- [ ] Seed or add more than 20 recipes; `/kitchen/recipes` shows one page with a working Next link and an accurate "Showing 1–20 of N"
- [ ] Page 2 keeps every active filter in the URL; changing any filter returns to page 1
- [ ] A search for a word that appears only in a recipe's ingredients finds it; one that appears only in its story finds it too
- [ ] A title match ranks above a match that only appears in the steps
- [ ] A two-word search returns only recipes containing both words, matching the old behaviour
- [ ] `"pot roast"` in quotes matches the phrase; `-beef` excludes
- [ ] A search with no matches shows the empty state, not an error
- [ ] Clicking a tag on a recipe card filters to that tag; the chip clears it
- [ ] The Favorites filter shows only favorited recipes and nothing when there are none
- [ ] Cookbook search returns the same results it did before, and the public section pages independently of your own books
- [ ] A recipe you cannot see never appears in any search result, on any page (check as a second account)

---

## 9. Photos and the installed app

### When to run

Changes to `kitchen/src/lib/{photos,cover-photo,recipe-photos}.ts`, `src/components/photos/**`, `src/app/actions/photos.ts`, `src/app/manifest.ts`, or the committed icons in `public/`.

### Manual

- [ ] Add a photo from a phone; the camera opens and the photo appears in the gallery on the recipe page
- [ ] A 3MB photo uploads, which the old 1MB cap rejected; a 6MB one is refused with the size message
- [ ] Add a second photo, then "Make this the cover"; the recipe page, the cookbook card and the public page all follow it
- [ ] Remove the cover photo; the recipe falls back to the next photo rather than showing none
- [ ] Remove every photo; the recipe renders with the "add a photo" placeholder and no broken image
- [ ] Add a photo from the editor's photo field; it lands in the gallery with a position, and becomes the cover if it is the first
- [ ] A viewer who cannot edit sees the photos but no cover or remove controls
- [ ] Check the OG image on a public recipe (`/kitchen/r/<slug>`) is the chosen cover, not the oldest photo
- [ ] Install the app on iOS and on Android; the home-screen icon is the pot on paper, not a generic placeholder, and is not cropped oddly on Android
- [ ] Long-press the installed icon; Add a recipe, Recipes and Cookbooks shortcuts appear and each opens the right page under `/kitchen`

---

## 10. Deploy verification

Both Workers deploy themselves: merging to `main` triggers a Workers Builds project for each, reporting as the `Workers Builds: kitchen` and `Workers Builds: lovethelaus` checks. Merging is the deploy, whichever half changed.

| What changed       | Deploy                                           |
| ------------------ | ------------------------------------------------ |
| Kitchen only       | merge to `main`; watch the Workers Builds checks |
| Marketing / router | same                                             |
| Both               | same                                             |

`npm run deploy:all` from a checkout is the fallback if an integration is disconnected.

Then run the automated smoke test, which needs no credentials and no checkout:

```bash
cd kitchen && npm run smoke                 # production
npm run smoke -- https://example.com/kitchen  # anywhere else
```

Actions → **Smoke** → Run workflow does the same thing from a phone, and is the only option from an environment whose network policy blocks the live domain — a sandbox that cannot open `lovethelaus.com` reports every assertion as a 403, which is the proxy talking, not the site. It covers the marketing pages, the app's public pages, the manifest's `start_url`, the PWA icons, and `/kitchen/sitemap.xml` — which renders only if the database is reachable and migrated. Page checks follow redirects on purpose: Cloudflare serves a folder index like `dist/privacy/index.html` at `/privacy/` and redirects `/privacy` to it, so a strict 200 check on the unslashed path calls a healthy page broken.

What it cannot see, check by hand: every section you changed, on production. Auth changes require the full **Section 1** matrix there.

Migrations do not run as part of a deploy. Apply them first, from Actions → **Database** → Run workflow, or `npm run db:migrate` from a checkout.

---

## Quick reference: auth file map

Full detail, including how to tell apart the three sign-in failures that show the same message, is in [`AUTH.md`](AUTH.md).

| Flow                 | Key files                                                                   |
| -------------------- | --------------------------------------------------------------------------- |
| Better Auth instance | `kitchen/src/lib/better-auth.ts`, handler `api/auth/[...all]`               |
| Sign in/up           | `kitchen/src/lib/auth.ts`, `api/auth/sign-in`, `sign-up`, `actions/auth.ts` |
| Magic link           | `api/auth/magic-link`, `sign-in/one-time`                                   |
| Forgot/reset         | `requestPasswordReset`, `ResetPasswordForm`, `resetPasswordAction`          |
| Callback / redirects | `kitchen/src/app/auth/callback/route.ts`, `kitchen/src/lib/post-auth.ts`    |
| Route guard          | `kitchen/src/proxy.ts`                                                      |
| Email                | `kitchen/src/lib/email.ts`, `email-templates.ts`                            |
| Router               | `workers/router/src/index.ts`                                               |
