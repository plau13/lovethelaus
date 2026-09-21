# Observability — debug playbook

Kitchen runs on Cloudflare Workers (OpenNext) with structured JSON logs and optional Sentry. Use this doc when something breaks in production or you need to correlate a user report with logs.

## Where errors go

| Layer          | Tool                                         | What it captures                                         |
| -------------- | -------------------------------------------- | -------------------------------------------------------- |
| Server triage  | **Sentry** (`reportError`, error boundaries) | Exceptions with `event` tag, release, route, `cf_ray`    |
| Server always  | **Workers Logs** (`log.ts`)                  | Every `logWarn` / `logError` / `reportError` line        |
| Uncaught fetch | **worker-shim**                              | `worker.uncaught`, `worker.upstream_5xx` JSON lines      |
| Router         | **lovethelaus Worker**                       | `router.kitchen_proxy`, `router.kitchen_upstream_error`  |
| Client         | **Sentry browser**                           | React error boundaries, replay-on-error, feedback widget |

There is **no `instrumentation.ts`** — OpenNext on Cloudflare cannot load it. Server Sentry uses lazy init in `kitchen/src/lib/sentry.ts`.

## 5-minute debug flow

1. **Sentry issue** — note `event` tag, `release` (e.g. `kitchen@df36def`), `cf_ray`, `route`, user id.
2. **Cloudflare → Workers → kitchen → Logs** — filter JSON on `event` or `cfRay`.
3. **Git** — `release` maps to commit: `git show kitchen@<sha>` or `git log --oneline | head`.
4. **Router** — if Kitchen returned 502, check **lovethelaus** Worker logs for `router.kitchen_upstream_error`.
5. **Stripe** — filter `stripe.webhook.*`; `bad_signature` is log-only (not Sentry) by design.

## Build variables (Workers → kitchen → Settings → Build)

Required for client errors:

- `NEXT_PUBLIC_SENTRY_DSN`

Optional for readable stacks (recommended):

- `SENTRY_ORG` — `pal-capital`
- `SENTRY_PROJECT` — `kitchen`
- `SENTRY_AUTH_TOKEN` — auth token with `project:releases` + source map upload

Release tags are set automatically by `npm run build:cf` (`kitchen@<git-sha>`). Override with `SENTRY_RELEASE` / `NEXT_PUBLIC_SENTRY_RELEASE` if needed.

Worker secret (server): `SENTRY_DSN` via `wrangler secret put`.

## Alerts (dashboard — owner)

1. **Cloudflare → Notifications → Workers → Script Errors** — scope to `kitchen` and `lovethelaus`.
2. **Sentry → Alerts** — new issue on `kitchen` project; optional spike rule (>10 events/hour).
3. Optional tag alert: `event:stripe.webhook.handler_failed`.

## New structured events

| Event                           | Worker      | Level | Sentry?                 |
| ------------------------------- | ----------- | ----- | ----------------------- |
| `worker.uncaught`               | kitchen     | error | via process hook + logs |
| `worker.upstream_5xx`           | kitchen     | error | logs only               |
| `worker.uncaught_exception`     | kitchen     | error | yes                     |
| `worker.unhandled_rejection`    | kitchen     | error | yes                     |
| `router.kitchen_proxy`          | lovethelaus | info  | no                      |
| `router.kitchen_upstream_error` | lovethelaus | error | no                      |
| `router.static_asset`           | lovethelaus | info  | no                      |
| `router.favicon_rewrite`        | lovethelaus | info  | no                      |

See [`CLOUDFLARE.md`](CLOUDFLARE.md) for the full event catalog.

## Local verification

```bash
cd kitchen && npm test
cd kitchen && npm run build:cf
cd kitchen && node scripts/verify-config.mjs
```

With DSN set locally, trigger a test error and confirm Sentry receives `release` and `event` tags. Client replay records only on error (`replaysOnErrorSampleRate: 1`, session sampling 0).

## Scaling notes

- Logs/traces sample at 100% today (family traffic). Reduce `tracesSampleRate` in `sentry-shared.ts` before touching error logs.
- Consider Logpush when dashboard retention is insufficient.
- `stripe.webhook.bad_signature` stays Cloudflare-only to avoid Sentry noise from forged requests.
