/**
 * What the demo account is, given an environment. Both the seed script and the
 * "Try the demo" route ask this, and they have to get the same answer — a seed
 * that creates one address while the route signs in with another leaves the
 * button dead on a site that looks fine.
 *
 * Every value here is optional, so every fallback treats **blank as absent**.
 * `??` would not: an unset GitHub Actions secret arrives as the empty string,
 * which is neither null nor undefined, so `??` hands it straight through and
 * the account is created with no email at all.
 */

/**
 * Anything with the env vars on it: `process.env`, or a literal in a test. The
 * index signature is load-bearing — without it this is a "weak type" (every
 * property optional) and TypeScript refuses `process.env`, which carries its
 * keys through an index signature rather than as named properties.
 */
export type DemoEnv = {
  readonly DEMO_USER_EMAIL?: string;
  readonly DEMO_USER_NAME?: string;
  readonly DEMO_USER_PASSWORD?: string;
  readonly [key: string]: string | undefined;
};

export const DEFAULT_DEMO_EMAIL = "demo@lovethelaus.com";
export const DEFAULT_DEMO_NAME = "Demo Kitchen";

/** The demo account's address, lowercased the way the `user` table stores it. */
export function demoEmail(env: DemoEnv): string {
  return (env.DEMO_USER_EMAIL?.trim() || DEFAULT_DEMO_EMAIL).toLowerCase();
}

/** The display name on the demo account. */
export function demoName(env: DemoEnv): string {
  return env.DEMO_USER_NAME?.trim() || DEFAULT_DEMO_NAME;
}

/** The demo password, or "" when none is configured. Callers decide what that means. */
export function demoPassword(env: DemoEnv): string {
  return env.DEMO_USER_PASSWORD?.trim() || "";
}

/**
 * Whether an address is shaped like an email at all. Better Auth does the real
 * validation; this exists only so a typo in DEMO_USER_EMAIL fails with a
 * sentence naming the variable instead of a 400 from deep inside the seed.
 */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
