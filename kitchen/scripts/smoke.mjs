/**
 * Post-deploy smoke test. Asks the live site the handful of questions a broken
 * deploy answers wrongly, using nothing but `fetch` — no credentials, no
 * database client, no browser — so it can run from GitHub Actions on a phone.
 *
 * It is deliberately shallow. The by-hand matrix in docs/TESTING.md still owns
 * everything that needs a signed-in session, a real card, or an eye.
 *
 * Run with: node scripts/smoke.mjs [base-url]
 *   base-url defaults to $SMOKE_BASE_URL, then to the production Kitchen URL.
 */

const DEFAULT_BASE = "https://lovethelaus.com/kitchen";

const base = (process.argv[2] ?? process.env.SMOKE_BASE_URL ?? DEFAULT_BASE).replace(/\/+$/, "");
const { origin, pathname } = new URL(base);
/** "/kitchen" — the prefix the manifest, icons and sitemap are expected to carry. */
const basePath = pathname.replace(/\/+$/, "");

const results = [];

function pass(name) {
  results.push({ name, ok: true });
}

/** Records a failure and returns null, so callers can `return fail(...)`. */
function fail(name, detail) {
  results.push({ name, ok: false, detail });
  return null;
}

/** GET without following redirects, so a redirect is an answer rather than a detour. */
function get(url) {
  return fetch(url, { redirect: "manual", headers: { "user-agent": "kitchen-smoke" } });
}

/** The response when the URL returns 200 of the expected type; null, and a recorded failure, otherwise. */
async function okResponse(name, url, contentType) {
  let response;
  try {
    response = await get(url);
  } catch (error) {
    return fail(name, `${url} — ${error.message}`);
  }
  if (response.status !== 200) {
    return fail(name, `${url} — expected 200, got ${response.status}`);
  }
  const actual = response.headers.get("content-type") ?? "";
  if (contentType && !actual.includes(contentType)) {
    return fail(name, `${url} — expected ${contentType}, got ${actual || "no content-type"}`);
  }
  return response;
}

async function expectOk(name, url, contentType) {
  if (await okResponse(name, url, contentType)) {
    pass(name);
  }
}

async function expectBodyToContain(name, url, needle) {
  const response = await okResponse(name, url);
  if (!response) {
    return;
  }
  const body = await response.text();
  if (body.includes(needle)) {
    pass(name);
  } else {
    fail(name, `${url} — body never mentions ${JSON.stringify(needle)}`);
  }
}

async function expectRedirectTo(name, url, needle) {
  let response;
  try {
    response = await get(url);
  } catch (error) {
    fail(name, `${url} — ${error.message}`);
    return;
  }
  if (response.status < 300 || response.status >= 400) {
    fail(name, `${url} — expected a redirect, got ${response.status}`);
    return;
  }
  const location = response.headers.get("location") ?? "";
  if (location.includes(needle)) {
    pass(name);
  } else {
    fail(name, `${url} — redirected to ${location || "nowhere"}, wanted ${needle}`);
  }
}

async function checkManifest() {
  const name = "manifest start_url opens the app, not the marketing site";
  const response = await okResponse("manifest.webmanifest is served", `${base}/manifest.webmanifest`);
  if (!response) {
    fail(name, "the manifest could not be read");
    return;
  }
  pass("manifest.webmanifest is served");

  let manifest;
  try {
    manifest = JSON.parse(await response.text());
  } catch (error) {
    fail(name, `the manifest is not JSON — ${error.message}`);
    return;
  }

  // The bug this guards: start_url was "/recipes", which opened the Astro site.
  if (manifest.start_url === `${basePath}/recipes`) {
    pass(name);
  } else {
    fail(name, `start_url is ${manifest.start_url}`);
  }

  const scope = "manifest scope covers the app";
  if (manifest.scope === `${basePath}/`) {
    pass(scope);
  } else {
    fail(scope, `scope is ${manifest.scope}`);
  }

  const maskable = "manifest offers maskable icons at both sizes";
  const found = (manifest.icons ?? []).filter((icon) => icon.purpose === "maskable");
  if (found.length >= 2) {
    pass(maskable);
  } else {
    fail(maskable, `found ${found.length}; iOS and Android each want their own`);
  }
}

async function main() {
  console.log(`Smoke testing ${base}\n`);

  // The marketing site, and with it the router Worker that fronts both.
  await expectOk("marketing site responds", `${origin}/`);
  await expectOk("privacy policy is published", `${origin}/privacy`);

  // The app itself, signed out.
  await expectBodyToContain("signed-out landing page renders", base, "recipe box");
  await expectOk("sign-in page renders", `${base}/sign-in`);
  await expectRedirectTo("a signed-out recipe list redirects to sign-in", `${base}/recipes`, "/sign-in");

  // Public, crawlable pages. Explore and the sitemap both query Postgres, so a
  // 200 here means the database is reachable and the migrations have run.
  await expectOk("explore page renders", `${base}/explore`);
  await expectOk("sitemap is generated from the database", `${base}/sitemap.xml`, "xml");
  await expectBodyToContain("robots.txt points at the sitemap", `${base}/robots.txt`, `${basePath}/sitemap.xml`);

  // Installability.
  await checkManifest();
  for (const icon of ["icon-192.png", "icon-512.png", "icon-192-maskable.png", "icon-512-maskable.png"]) {
    await expectOk(`${icon} is served`, `${base}/${icon}`, "image/png");
  }

  const failures = results.filter((result) => !result.ok);
  for (const result of results) {
    console.log(`${result.ok ? "ok  " : "FAIL"}  ${result.name}`);
    if (!result.ok) {
      console.log(`        ${result.detail}`);
    }
  }
  console.log(`\n${results.length - failures.length}/${results.length} passed`);
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

await main();
