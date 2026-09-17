/**
 * Where to send someone after they authenticate. Single source of truth for the
 * sign-in/sign-up routes, server actions, the auth callback, and magic links.
 */

/** Accept only site-relative paths (no scheme, no protocol-relative `//host`). */
export function safeReturnTo(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return null;
  }
  if (/[\r\n]/.test(value)) {
    return null;
  }
  return value;
}

export function postAuthPath(
  user: { onboardingCompletedAt: Date | string | null } | null | undefined,
  returnTo?: string | null
): string {
  if (user && !user.onboardingCompletedAt) {
    return "/onboarding";
  }
  const safe = safeReturnTo(returnTo);
  if (safe && safe !== "/onboarding") {
    return safe.startsWith("/kitchen/") ? safe.slice("/kitchen".length) : safe;
  }
  return "/recipes";
}

/** Append a query parameter to a path that may already have a query string. */
export function withQuery(path: string, key: string, value: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}
