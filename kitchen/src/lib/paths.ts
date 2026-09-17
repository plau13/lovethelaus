/**
 * Kitchen is mounted under /kitchen. Next adds the basePath to `redirect()`, `<Link>` and
 * `router.push`, but NOT to `NextResponse.redirect`, `<img src>`, `fetch`, manifest/icon paths,
 * the service-worker scope, or callback URLs handed to Better Auth. Build those here.
 */
export const BASE_PATH = "/kitchen";

/** Site-relative path under the Kitchen base path. `appPath("/recipes")` → `/kitchen/recipes`. Idempotent. */
export function appPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === BASE_PATH || normalized.startsWith(`${BASE_PATH}/`) || normalized.startsWith(`${BASE_PATH}?`)) {
    return normalized;
  }
  return `${BASE_PATH}${normalized}`;
}

/** Public app URL from env (no trailing slash). */
export function appBaseUrl(): string {
  const raw = process.env.APP_URL?.trim() || `http://localhost:3000${BASE_PATH}`;
  return raw.replace(/\/+$/, "");
}

/** Absolute URL for a Kitchen path: `appUrl("/invite/abc")` → `https://lovethelaus.com/kitchen/invite/abc`. */
export function appUrl(path = "/"): string {
  const base = new URL(appBaseUrl());
  return new URL(appPath(path), base.origin).toString();
}

/** Origin of the public app URL (Better Auth `baseURL`). */
export function appOrigin(): string {
  return new URL(appBaseUrl()).origin;
}

/** URL of a recipe photo from its R2 key. */
export function photoUrl(key: string): string {
  return `${BASE_PATH}/api/recipe-photos/${key.split("/").map(encodeURIComponent).join("/")}`;
}

/** URL of a heritage media object (scanned card or voice memo) from its R2 key. */
export function mediaUrl(key: string): string {
  return `${BASE_PATH}/api/recipe-media/${key.split("/").map(encodeURIComponent).join("/")}`;
}

/** App-relative path of a public recipe page (slug when set, id as a permanent fallback). */
export function publicRecipePath(recipe: { id: string; slug: string | null }): string {
  return `/r/${recipe.slug ?? recipe.id}`;
}

export function publicCookbookPath(cookbook: { slug: string }): string {
  return `/c/${cookbook.slug}`;
}

/** Absolute canonical URL for a public recipe page. */
export function publicRecipeUrl(recipe: { id: string; slug: string | null }): string {
  return appUrl(publicRecipePath(recipe));
}

export function publicCookbookUrl(cookbook: { slug: string }): string {
  return appUrl(publicCookbookPath(cookbook));
}
