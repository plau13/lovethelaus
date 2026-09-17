# Credentials — every value the app needs, and how to get it

This is the setup runbook. [`CLOUDFLARE.md`](CLOUDFLARE.md) covers the deploy itself; this file covers the accounts and keys that deploy depends on.

The list below is the complete set of environment variables the code reads, taken from the source, not from memory:

```bash
cd kitchen && grep -rho "process\.env\.[A-Z_][A-Z0-9_]*" src scripts | sed 's/process\.env\.//' | sort -u
```

## At a glance

| Value                        | Needed for            | Secret? | Lives in                             |
| ---------------------------- | --------------------- | ------- | ------------------------------------ |
| `DATABASE_URL`               | **Everything**        | Yes     | Worker secret + `kitchen/.env`       |
| `DATABASE_URL_UNPOOLED`      | Migrations only       | Yes     | `kitchen/.env` only — never a secret |
| `BETTER_AUTH_SECRET`         | **Everything**        | Yes     | Worker secret + `kitchen/.env`       |
| `RESEND_API_KEY`             | Email                 | Yes     | Worker secret + `kitchen/.env`       |
| `DEMO_USER_PASSWORD`         | Demo account          | Yes     | Worker secret + `kitchen/.env`       |
| `DEMO_USER_EMAIL`            | Demo account          | No      | Worker secret + `kitchen/.env`       |
| `DEMO_USER_NAME`             | Seed script           | No      | `kitchen/.env` only                  |
| `STRIPE_SECRET_KEY`          | Kitchen Plus          | Yes     | Worker secret + `kitchen/.env`       |
| `STRIPE_WEBHOOK_SECRET`      | Kitchen Plus          | Yes     | Worker secret + `kitchen/.env`       |
| `STRIPE_PRICE_KITCHEN_PLUS`  | Kitchen Plus          | No      | `wrangler.jsonc` `vars`              |
| `ANTHROPIC_API_KEY`          | Card reading, imports | Yes     | Worker secret + `kitchen/.env`       |
| `APP_URL`                    | Auth callbacks, links | No      | `wrangler.jsonc` `vars` + `.env`     |
| `EMAIL_FROM`                 | Email sender          | No      | `wrangler.jsonc` `vars` + `.env`     |
| `SUPPORT_EMAIL`              | Settings, reply-to    | No      | `wrangler.jsonc` `vars` + `.env`     |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Ads                   | No      | `kitchen/.env` at **build** time     |
| `NEXT_PUBLIC_ADSENSE_SLOT_*` | Ads                   | No      | `kitchen/.env` at **build** time     |
| `NEXT_PUBLIC_GA_ID`          | Analytics             | No      | `kitchen/.env` at **build** time     |
| `PUBLIC_KITCHEN_URL`         | Marketing site links  | No      | Set by `npm run build:prod`          |

Three different places, and the difference matters:

- **Worker secrets** (`wrangler secret put`) are encrypted by Cloudflare and read at runtime. Changing one takes effect immediately, no rebuild.
- **`wrangler.jsonc` `vars`** are plain text committed to the repo. Non-sensitive config only. Changing one needs a commit and a deploy.
- **`NEXT_PUBLIC_*`** are compiled into the browser bundle at build time, from `kitchen/.env` on whichever machine runs `npm run deploy`. They are **not** Worker secrets, and changing one needs a rebuild.

Never commit `.env`, `.env.local`, or `.dev.vars`. Only the `.example` files belong in git.

---

## 1. Neon — `DATABASE_URL`, `DATABASE_URL_UNPOOLED`

1. Sign up at [neon.tech](https://neon.tech) and create a project named `kitchen`.
2. Create two branches: `main` for production, `dev` for local work.
3. On the project dashboard, open **Connection Details**.
4. With **Connection pooling** switched **on**, copy the string. It contains `-pooler` in the host. That is `DATABASE_URL`.
5. Switch pooling **off** and copy again. No `-pooler` in the host. That is `DATABASE_URL_UNPOOLED`.

Both look like `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`.

Why two: the app runs on Workers and opens many short connections, so it needs the pooler. `drizzle-kit` runs schema changes that the pooler cannot express, so migrations need the direct URL. The unpooled one is only ever used from your machine or CI, so it is never uploaded as a Worker secret.

Point local work at the `dev` branch and production at `main`, so a bad migration locally cannot touch real recipes.

## 2. Better Auth — `BETTER_AUTH_SECRET`

Nothing to sign up for. Generate it:

```bash
openssl rand -base64 32
```

This signs session cookies. Use a different value locally and in production. Rotating it immediately signs out every logged-in person, so treat it as permanent unless you believe it leaked.

## 3. Resend — `RESEND_API_KEY`, `EMAIL_FROM`

1. Sign up at [resend.com](https://resend.com).
2. **Domains → Add Domain**, enter `lovethelaus.com`.
3. Resend shows DNS records, SPF and DKIM. Add them at your registrar and wait for Resend to show Verified. This usually takes minutes but can take hours.
4. **API Keys → Create API Key**, permission "Sending access". Copy it once; it is never shown again. That is `RESEND_API_KEY`.
5. `EMAIL_FROM` is any address on the verified domain, e.g. `Kitchen <kitchen@lovethelaus.com>`.

Until the domain verifies, Resend only delivers to the address that owns the account, which makes invites look broken when testing with family.

Leave `RESEND_API_KEY` empty locally on purpose: emails then print to the dev server console, which is faster than real delivery for testing invites and password resets.

## 4. Stripe — three values

Do this in **test mode** first. The toggle is in the Stripe dashboard header.

**`STRIPE_SECRET_KEY`**
**Developers → API keys → Secret key**. Starts `sk_test_` in test mode, `sk_live_` in production. Reveal and copy.

**`STRIPE_PRICE_KITCHEN_PLUS`**

1. **Product catalogue → Add product**, name it `Kitchen Plus`.
2. Add one **recurring** price and pick the interval.
3. Save, then copy the **price** id. It starts `price_`, not `prod_`. A product id here will fail at checkout.

This one is not a secret, so it goes in `kitchen/wrangler.jsonc` under `vars`, where it is currently an empty string.

**`STRIPE_WEBHOOK_SECRET`**

1. **Developers → Webhooks → Add endpoint**.
2. URL: `https://lovethelaus.com/kitchen/api/stripe/webhook`
3. Select exactly these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. After creating it, reveal the **Signing secret**. Starts `whsec_`.

Also enable **Settings → Billing → Customer portal**, or the "Manage plan" button in Settings has nowhere to send people.

Locally you get a different signing secret from the CLI:

```bash
stripe listen --forward-to localhost:3000/kitchen/api/stripe/webhook
```

It prints a `whsec_` value for that session. Use that one in `kitchen/.env`.

## 5. Anthropic — `ANTHROPIC_API_KEY` (optional)

1. Sign in at [console.anthropic.com](https://console.anthropic.com).
2. **API keys → Create key**. Copy it once.
3. Add credit under **Billing**, or calls fail on the first request.

Without this key the app degrades quietly and deliberately: "Read this card" is hidden rather than broken, and URL imports save the raw draft instead of a structured one. Nothing errors.

## 6. Google AdSense — `NEXT_PUBLIC_ADSENSE_*` (optional)

Approval takes days to weeks and needs real content already live, so deploy first and come back to this.

1. Sign up at [adsense.google.com](https://adsense.google.com) and add `lovethelaus.com`.
2. Add the site verification snippet, then wait for approval.
3. Once approved, your publisher id is on the account page as `ca-pub-XXXXXXXXXXXXXXXX`. That is `NEXT_PUBLIC_ADSENSE_CLIENT`.
4. **Ads → By ad unit**, create four display units and copy each slot id:

| Unit               | Variable                             |
| ------------------ | ------------------------------------ |
| 300×600 desktop    | `NEXT_PUBLIC_ADSENSE_SLOT_RAIL`      |
| 300×250 rectangle  | `NEXT_PUBLIC_ADSENSE_SLOT_RECT`      |
| Responsive display | `NEXT_PUBLIC_ADSENSE_SLOT_INCONTENT` |
| Anchor / overlay   | `NEXT_PUBLIC_ADSENSE_SLOT_ANCHOR`    |

5. Enable **Privacy & messaging → GDPR** and **CCPA** in the AdSense console. This is the consent banner, and it is a legal requirement in several markets. It is a console setting, not something the code can do.
6. Put the real publisher id in the root `ads.txt`, replacing the placeholder.

Nothing renders until `NEXT_PUBLIC_ADSENSE_CLIENT` is set, so the code ships safely before approval. See [`ADS.md`](ADS.md).

## 7. Google Analytics — `NEXT_PUBLIC_GA_ID` (optional)

[analytics.google.com](https://analytics.google.com) → **Admin → Data streams → Add stream → Web**. The Measurement ID is `G-XXXXXXXXXX`. Only loads on the public pages.

## 8. Demo account — `DEMO_USER_*`

You invent these; there is no provider.

- `DEMO_USER_EMAIL` — `demo@lovethelaus.com`
- `DEMO_USER_NAME` — `Demo Kitchen`
- `DEMO_USER_PASSWORD` — generate one, e.g. `openssl rand -base64 24`

Set the password **before** running `npm run db:seed:demo`; the seed creates the account with whatever is set at that moment. It backs the "Try demo" button, so anyone can sign in with it. Never reuse a personal password.

---

## Putting the values in place

```bash
cd kitchen
cp .env.example .env        # fill in every value for local work
cp .dev.vars.example .dev.vars   # only if you use `npm run preview`
```

Then production, one prompt per secret:

```bash
cd kitchen
npx wrangler secret put DATABASE_URL          # the POOLED one
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put DEMO_USER_EMAIL
npx wrangler secret put DEMO_USER_PASSWORD
npx wrangler secret put ANTHROPIC_API_KEY     # optional
```

`DATABASE_URL_UNPOOLED` is deliberately absent: migrations never run on the Worker.

Edit `kitchen/wrangler.jsonc` `vars` for `STRIPE_PRICE_KITCHEN_PLUS`, and commit it.

## Order of operations

R2 buckets and migrations come before the first deploy. The app queries columns that only exist after the migrations run.

```bash
cd kitchen
npx wrangler r2 bucket create kitchen-opennext-cache
npx wrangler r2 bucket create kitchen-recipe-photos
npm run db:migrate          # uses DATABASE_URL_UNPOOLED from kitchen/.env
npm run db:seed:demo        # optional
cd .. && npm run deploy:all
```

## Checking your work

```bash
cd kitchen && npx wrangler secret list   # names only, never values
```

Then, on the deployed site:

| Works                               | Means                                             |
| ----------------------------------- | ------------------------------------------------- |
| Sign-up completes                   | `DATABASE_URL` and `BETTER_AUTH_SECRET` are right |
| The welcome email arrives           | `RESEND_API_KEY` is right and the domain verified |
| A recipe list loads                 | Migrations ran                                    |
| A photo uploads and shows           | The `kitchen-recipe-photos` bucket is bound       |
| "Upgrade" reaches Stripe checkout   | Secret key and price id are right                 |
| The plan flips to Plus after paying | The webhook secret and endpoint are right         |
| "Read this card" appears on a scan  | `ANTHROPIC_API_KEY` is set                        |

The webhook is the one that fails quietly: checkout succeeds, money moves, and the account stays on the free tier. Test it in Stripe test mode before going live, and watch the endpoint's delivery log in the Stripe dashboard.

## Things only you can do

Outside the repo, and no amount of code changes them:

- Verify `lovethelaus.com` in Resend, by adding DNS records at the registrar.
- Get AdSense approval, and enable Privacy & messaging for consent.
- Fill the `[Company Legal Name]` placeholders in `src/pages/privacy.md` and `src/pages/terms.md`.
