# Auth — how sign-in works, and how to debug it

Better Auth runs in-process on the Kitchen Worker. There is no auth service, no client-side auth SDK, and no separate profile table: **Better Auth's `user` table _is_ the application user table**, which is why `defaultServings`, `subscriptionTier` and the rest hang off it as `additionalFields` rather than living somewhere that would need joining on every render.

Read [`ARCHITECTURE.md`](ARCHITECTURE.md) first for the stack decision. This document is the subsystem: what the tables mean, the four ways a person gets a session, and — most usefully — **how to tell apart three sign-in failures that all show the user the same sentence**.

## The four tables

| Table          | What it holds                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `user`         | Identity **and** app profile. Email is stored lowercased. `onboardingCompletedAt` gates the app; the four preferences live here too.   |
| `account`      | Credentials, one row per provider. Password sign-in needs a row with `provider_id = 'credential'` whose `password` column is non-null. |
| `session`      | Server-side sessions. Also cached into a signed cookie — see below.                                                                    |
| `verification` | Short-lived tokens for magic links (15 min) and password resets (60 min). Consumed on use.                                             |

**The split between `user` and `account` is the single most important thing to understand here.** A `user` row is _not_ enough to sign in with a password. If someone arrives by magic link, Better Auth creates the `user` row and **no credential `account` row** — there is no password to check, forever, until a reset creates one. This is the cause of most "my password doesn't work" reports, and it looks identical to a typo.

## The four ways in

1. **Email + password** — `signInAction` → `signIn()` in `src/lib/auth.ts` → `auth.api.signInEmail`.
2. **Magic link** — `magicLinkAction` → `auth.api.signInMagicLink`; Resend sends it; Better Auth's catch-all at `/kitchen/api/auth/*` verifies and redirects to `/kitchen/auth/callback`.
3. **Demo** — `GET /kitchen/api/auth/demo` signs in with the seeded account. Address and password both resolve through `src/lib/demo-account.ts`, so the seed and the button cannot disagree about who the demo user is. With no `DEMO_USER_PASSWORD` the route says the demo is unavailable instead of failing silently, and the sign-in page hides the button.
4. **Invite acceptance** — signing up with an invited address auto-accepts pending `cookbook_invite` rows via the `databaseHooks.user.create.after` hook.

All four converge on `postAuthPath()` (`src/lib/post-auth.ts`): incomplete onboarding → `/onboarding`, otherwise `returnTo` (site-relative only) or `/recipes`. That rule exists in exactly one place on purpose — it used to be duplicated four or five times, and the copies drifted.

## Sessions and the cookie cache

`session.cookieCache` is enabled with a 5-minute TTL and the `compact` strategy, so a signed `session_data` cookie answers `getSession` with **zero database queries**. Logged-out renders never touch Neon at all.

The cost of that speed is staleness, and it has bitten this codebase twice:

- **After mutating the `user` row, call `refreshSessionCache()`** (or read with `{ fresh: true }`). Onboarding, Settings, the import quota and the Stripe success page all do. Skip it and the app reads a 5-minute-old copy of the row you just wrote.
- **Never decide onboarding is incomplete from the cache alone.** `requireOnboardedUser` re-reads fresh before it redirects, and logs `onboarding.stale_session` when the fresh read disagrees. Believing the stale cookie bounces the browser `/recipes` → `/onboarding` → the same form, which presents to the user as a **"Finish setup" button that does nothing**. That was a real bug, not a hypothetical.

`src/proxy.ts` only checks for cookie _presence_ — no database access, no validation. Real enforcement is `requireUser()` / `requireOnboardedUser()` in the pages. The proxy is a redirect convenience, never a security boundary.

## Troubleshooting: "my password doesn't work"

Better Auth deliberately returns **one** error for three different causes, so nobody can probe which addresses have accounts. The user always sees _"That email and password do not match."_ But each cause writes a **different** warning to the Worker console (`better-auth/dist/api/routes/sign-in.mjs`, the email sign-in handler):

| Worker log line      | Actual cause                                                                                             | Fix                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `User not found`     | No `user` row for that email — **or** a `user` row with no credential `account` (magic-link-only signup) | Sign up, or use **Forgot password** (see below) |
| `Password not found` | Credential row exists but its `password` column is null                                                  | **Forgot password**                             |
| `Invalid password`   | User and credential both exist; the password is simply wrong                                             | Reset it, or try again                          |

**So: open Workers Logs for the `kitchen` Worker, reproduce the sign-in, and read the warning.** That turns a guess into a fact. Do not try to infer the cause from the on-screen message — by design it carries no information.

Two things that are **never** the cause, so don't spend time there:

- **Email case.** `validEmail()` lowercases before the call, and Better Auth lowercases again on lookup. `Preston.Lau@` and `preston.lau@` are the same account.
- **A changed `BETTER_AUTH_SECRET`.** The secret signs cookies and tokens; passwords are hashed with scrypt independently of it. Rotating it invalidates **sessions and outstanding magic links**, so everyone is logged out and old links die — but stored passwords keep working.

### Why "Forgot password" is the universal unstick

Better Auth's reset handler **creates** the credential `account` row when one is missing, instead of erroring:

```js
if (!(await ctx.context.internalAdapter.findCredentialAccount(userId)))
  await ctx.context.internalAdapter.createAccount({
    userId,
    providerId: 'credential',
    accountId: user.id,
    password: hashedPassword,
  });
else await ctx.context.internalAdapter.updatePassword(userId, hashedPassword);
```

That means a reset fixes both `User not found` (when a user row does exist) and `Password not found`, not just a forgotten password. It is the right first move for any credential problem on an account that exists.

Caveats when using it:

- `requestPasswordReset` returns success for addresses with **no account**, again to prevent enumeration. "Check your email" is not evidence the account exists.
- With no `RESEND_API_KEY`, `sendEmail()` prints the message to the console rather than sending it (`src/lib/email.ts`). If no email arrives, **the reset link is in Workers Logs** and still works.

### Deciding whether the account exists at all

The fastest test that needs no log access: **try to sign up with the address.**

- _"An account with that email already exists"_ → the `user` row is there, so it is a credential problem → Forgot password.
- _It creates the account_ → it never existed in this database.

That second outcome is expected more often than it looks. The Neon database was created fresh at the Phase 1 cutover with one baseline migration and **no password-hash migration** — nothing carried over from the pre-Neon stack. An account remembered from before that cutover does not exist here.

## Rules that keep this working

1. **`baseURL` is the bare origin; `basePath` is `/kitchen/api/auth`.** Putting a path in `baseURL` silently overrides `basePath`. Callback URLs resolve against the site root, so always build them with `appPath()`.
2. **Construct `auth` lazily** via `getAuth()`. Never at module scope: `next build` and cold isolates must not require env.
3. **`nextCookies()` stays last in the plugin list.** It is what lets `auth.api.*` set cookies from server actions and route handlers.
4. **Cookie names differ by scheme** — `__Secure-kitchen.session_token` on https, `kitchen.session_token` on `http://localhost`. `getSessionCookie` handles both; hand-rolled cookie reads will not.
5. **Email is normalized on the way in, once.** `validEmail()` trims and lowercases; the create hook does the same for signup. Don't add a third place.

## File map

| Concern                   | File                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Better Auth config        | `kitchen/src/lib/better-auth.ts` (lazy `getAuth()`)                                                                            |
| Facade used by the app    | `kitchen/src/lib/auth.ts` (`getCurrentUser`, `requireUser`, `requireOnboardedUser`, `refreshSessionCache`, `authErrorMessage`) |
| Server actions            | `kitchen/src/app/actions/auth.ts`                                                                                              |
| Better Auth route handler | `kitchen/src/app/api/auth/[...all]/route.ts`                                                                                   |
| Demo sign-in              | `kitchen/src/app/api/auth/demo/route.ts`, `kitchen/src/lib/demo-account.ts`                                                    |
| Post-login destination    | `kitchen/src/lib/post-auth.ts`                                                                                                 |
| Cookie-presence guard     | `kitchen/src/proxy.ts`                                                                                                         |
| Email delivery            | `kitchen/src/lib/email.ts`, `kitchen/src/lib/email-templates.ts`                                                               |

Test matrix: [`TESTING.md`](TESTING.md) §1 — run **all** of it when touching auth or email, not just the flow you edited.

## Better Auth Infrastructure dashboard

The `dash()` plugin in `kitchen/src/lib/better-auth.ts` connects Kitchen to [dash.better-auth.com](https://dash.better-auth.com) for user analytics and audit logs. Set `BETTER_AUTH_API_KEY` as a Kitchen Worker secret (`wrangler secret put BETTER_AUTH_API_KEY`). Auth works without it; the dashboard does not.

When connecting an existing project, use **Base URL** `https://lovethelaus.com` and **Base Path** `/kitchen/api/auth` (not the default `/api/auth`). Do not typo the domain (`lovethelaus.com`, not `lovethelauds.com`).

OpenNext on Cloudflare does not reliably route nested `/api/auth/dash/*` paths in production. Kitchen serves the validate handler at `/kitchen/api/auth/dash-validate` (`kitchen/src/app/api/auth/dash-validate/route.ts`), and the router Worker rewrites `/kitchen/api/auth/dash/validate` to that alias before proxying. After deploy, `GET /kitchen/api/auth/dash/validate` should return **401** with `{"message":"Invalid API key"}` rather than **404**.
