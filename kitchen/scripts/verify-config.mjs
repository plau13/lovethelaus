/**
 * Sanitized config verification for Cloudflare + GitHub secrets.
 * Prints host/mode checks only — never passwords or full connection strings.
 *
 * Usage (GitHub Actions or local with env loaded):
 *   node scripts/verify-config.mjs
 */

function parseHost(url) {
  if (!url?.trim()) return null;
  try {
    return new URL(url.replace(/^postgres(ql)?:\/\//, "https://")).hostname;
  } catch {
    return null;
  }
}

function check(name, ok, detail) {
  const line = ok ? `ok   ${name}` : `FAIL ${name}`;
  console.log(detail ? `${line} — ${detail}` : line);
  return ok ? 0 : 1;
}

function isNeonHost(host) {
  return Boolean(host && host.includes("neon.tech"));
}

function isSupabaseHost(host) {
  return Boolean(host && host.includes("supabase.com"));
}

function isPooledNeon(host) {
  return Boolean(host && host.includes("-pooler"));
}

const pooled = process.env.DATABASE_URL?.trim() || "";
const unpooled = process.env.DATABASE_URL_UNPOOLED?.trim() || "";
const pooledHost = parseHost(pooled);
const unpooledHost = parseHost(unpooled);

let failures = 0;

console.log("Config verification (sanitized)\n");

if (!pooled && !unpooled) {
  console.log("FAIL no DATABASE_URL or DATABASE_URL_UNPOOLED in environment");
  process.exit(1);
}

if (pooledHost) {
  failures += check(
    "DATABASE_URL host",
    isNeonHost(pooledHost) && !isSupabaseHost(pooledHost),
    `${pooledHost}${isPooledNeon(pooledHost) ? " (pooled)" : " (NOT pooled — use -pooler for Worker runtime)"}`
  );
}

if (unpooledHost) {
  failures += check(
    "DATABASE_URL_UNPOOLED host",
    isNeonHost(unpooledHost) && !isSupabaseHost(unpooledHost),
    `${unpooledHost}${isPooledNeon(unpooledHost) ? " (has -pooler — use direct URL for migrations)" : " (direct)"}`
  );
}

if (pooledHost && unpooledHost && pooledHost === unpooledHost) {
  failures += check(
    "distinct connection endpoints",
    false,
    "DATABASE_URL and DATABASE_URL_UNPOOLED resolve to the same host — expected pooled vs direct pair"
  );
}

const authSecret = process.env.BETTER_AUTH_SECRET?.trim() || "";
failures += check("BETTER_AUTH_SECRET set", authSecret.length >= 16, authSecret ? "present" : "missing or too short");

const demoPassword = process.env.DEMO_USER_PASSWORD?.trim() || "";
failures += check("DEMO_USER_PASSWORD set", demoPassword.length >= 8, demoPassword ? "present" : "missing");

const stripeKey = process.env.STRIPE_SECRET_KEY?.trim() || "";
if (stripeKey) {
  const live = stripeKey.startsWith("sk_live_");
  const test = stripeKey.startsWith("sk_test_");
  failures += check(
    "STRIPE_SECRET_KEY mode",
    live || test,
    live ? "live (matches wrangler.jsonc live price ids)" : test ? "TEST — wrangler.jsonc has live price_ ids; checkout will fail" : "unrecognized prefix"
  );
} else {
  console.log("skip STRIPE_SECRET_KEY (not in this environment)");
}

const webhook = process.env.STRIPE_WEBHOOK_SECRET?.trim() || "";
if (webhook) {
  failures += check("STRIPE_WEBHOOK_SECRET format", webhook.startsWith("whsec_"), webhook.slice(0, 10) + "…");
}

const sentryDsn = process.env.SENTRY_DSN?.trim() || "";
if (sentryDsn) {
  failures += check(
    "SENTRY_DSN host",
    sentryDsn.includes("sentry.io") || sentryDsn.includes("ingest."),
    "present (server error reporting enabled)",
  );
} else {
  console.log("warn SENTRY_DSN unset — reportError will log to Cloudflare only, not Sentry");
}

const publicSentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || "";
if (publicSentryDsn) {
  failures += check(
    "NEXT_PUBLIC_SENTRY_DSN host",
    publicSentryDsn.includes("sentry.io") || publicSentryDsn.includes("ingest."),
    "present (client error reporting enabled at build time)",
  );
} else if (process.env.WORKERS_CI === "1" || process.env.CI === "true") {
  console.log("warn NEXT_PUBLIC_SENTRY_DSN unset — browser errors will not reach Sentry until build variable is set");
}

if (sentryDsn && publicSentryDsn && sentryDsn !== publicSentryDsn) {
  console.log("warn SENTRY_DSN and NEXT_PUBLIC_SENTRY_DSN differ — usually they should match");
}

const sentryOrg = process.env.SENTRY_ORG?.trim() || "";
const sentryProject = process.env.SENTRY_PROJECT?.trim() || "";
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN?.trim() || "";
if (sentryOrg && sentryProject && sentryAuthToken) {
  console.log(`ok Sentry source maps configured (${sentryOrg}/${sentryProject})`);
} else if (process.env.WORKERS_CI === "1" || process.env.CI === "true") {
  console.log(
    "warn SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN unset — build will succeed but Sentry stacks stay minified",
  );
}

const sentryRelease = process.env.SENTRY_RELEASE?.trim() || "";
if (sentryRelease) {
  failures += check("SENTRY_RELEASE format", sentryRelease.startsWith("kitchen@"), sentryRelease);
} else {
  console.log("note SENTRY_RELEASE unset locally — build:cf sets kitchen@<git-sha> automatically");
}

console.log(`\n${failures === 0 ? "All checks passed" : `${failures} check(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
