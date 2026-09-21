import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { APIError } from "better-auth/api";
import type { schema } from "@/db/client";
import { getAuth, type SessionUser } from "@/lib/better-auth";
import { logWarn } from "@/lib/log";
import { appPath } from "@/lib/paths";

/**
 * The signed-in user as pages and actions see it: the `user` row minus the columns Better Auth
 * never returns (`onboardingAnswers`, Stripe ids). Same shape the app used before the migration.
 */
export type CurrentUser = Omit<
  typeof schema.user.$inferSelect,
  "onboardingAnswers" | "stripeCustomerId" | "stripeSubscriptionId"
>;

type GetUserOptions = { fresh?: boolean };

function asDate(value: unknown): Date | null {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Better Auth types optional additional fields as `T | null | undefined`, and the cookie cache
 * round-trips through JSON. Apply the column defaults and turn date strings back into Dates.
 */
function normalizeUser(user: SessionUser): CurrentUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image ?? null,
    createdAt: asDate(user.createdAt) ?? new Date(0),
    updatedAt: asDate(user.updatedAt) ?? new Date(0),
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    defaultServings: user.defaultServings ?? 4,
    preferredUnits: user.preferredUnits ?? "us",
    defaultCookbookVisibility: user.defaultCookbookVisibility ?? "private",
    onboardingCompletedAt: asDate(user.onboardingCompletedAt),
    subscriptionTier: user.subscriptionTier ?? "free",
    socialImportCount: user.socialImportCount ?? 0,
    socialImportPeriodStart: asDate(user.socialImportPeriodStart),
    socialImportPeriodCount: user.socialImportPeriodCount ?? 0,
    subscriptionStatus: user.subscriptionStatus ?? null,
    currentPeriodEnd: asDate(user.currentPeriodEnd),
  };
}

async function loadUser(fresh: boolean): Promise<CurrentUser | null> {
  // Read request headers first: during static prerender this bails out to dynamic rendering
  // before the auth/database instance (which needs env) is constructed.
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({
    headers: requestHeaders,
    query: fresh ? { disableCookieCache: true } : undefined,
  });
  return session?.user ? normalizeUser(session.user) : null;
}

const loadCachedUser = cache(() => loadUser(false));

/** Current user or null. Served from the session cookie cache unless `fresh` is set. */
export async function getCurrentUser(options?: GetUserOptions): Promise<CurrentUser | null> {
  return options?.fresh ? loadUser(true) : loadCachedUser();
}

export async function requireUser(options?: GetUserOptions) {
  const user = await getCurrentUser(options);
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

export async function requireOnboardedUser(options?: GetUserOptions) {
  const user = await requireUser(options);
  if (user.onboardingCompletedAt) {
    return user;
  }

  // Never send someone back to onboarding on the strength of a cached session
  // alone. Finishing setup writes the timestamp and redirects here; if the
  // cookie cache has not caught up, believing it bounces the browser
  // /recipes → /onboarding → the same form, which looks exactly like a
  // "Finish setup" button that does nothing. One extra read on this path is
  // cheaper than that, and only ever happens when onboarding looks incomplete.
  const fresh = await getCurrentUser({ fresh: true });
  if (fresh?.onboardingCompletedAt) {
    logWarn("onboarding.stale_session", { userId: fresh.id });
    return fresh;
  }

  redirect("/onboarding");
}

/** Re-read the session from the database and rewrite the cookie cache (call after mutating `user`). */
export async function refreshSessionCache(): Promise<void> {
  const requestHeaders = await headers();
  await getAuth().api.getSession({ headers: requestHeaders, query: { disableCookieCache: true } });
}

export type AuthResult = { setCookies: string[] };

function validEmail(emailRaw: string): string {
  const email = emailRaw.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new Error("Enter a real email address.");
  }
  return email;
}

async function requestHeaders(explicit?: Headers): Promise<Headers> {
  return explicit ?? (await headers());
}

export async function signUp(nameRaw: string, emailRaw: string, password: string, reqHeaders?: Headers): Promise<AuthResult> {
  const email = validEmail(emailRaw);
  const name = nameRaw.trim() || email.split("@")[0] || "Family cook";
  if (password.length < 8) {
    throw new Error("Use at least 8 characters for your password.");
  }
  const { headers: responseHeaders } = await getAuth().api.signUpEmail({
    body: { email, password, name },
    headers: await requestHeaders(reqHeaders),
    returnHeaders: true,
  });
  return { setCookies: responseHeaders.getSetCookie() };
}

export async function signIn(emailRaw: string, password: string, reqHeaders?: Headers): Promise<AuthResult> {
  const email = validEmail(emailRaw);
  if (!password) {
    throw new Error("Enter your password.");
  }
  const { headers: responseHeaders } = await getAuth().api.signInEmail({
    body: { email, password },
    headers: await requestHeaders(reqHeaders),
    returnHeaders: true,
  });
  return { setCookies: responseHeaders.getSetCookie() };
}

export async function signOut(): Promise<void> {
  const requestHeaders = await headers();
  await getAuth().api.signOut({ headers: requestHeaders });
}

export async function requestPasswordReset(emailRaw: string, reqHeaders?: Headers): Promise<void> {
  const email = validEmail(emailRaw);
  await getAuth().api.requestPasswordReset({
    body: { email, redirectTo: appPath("/reset-password") },
    headers: await requestHeaders(reqHeaders),
  });
}

export async function signInWithMagicLink(emailRaw: string, returnTo?: string | null, reqHeaders?: Headers): Promise<void> {
  const email = validEmail(emailRaw);
  const callback = returnTo ? `${appPath("/auth/callback")}?returnTo=${encodeURIComponent(returnTo)}` : appPath("/auth/callback");
  await getAuth().api.signInMagicLink({
    body: {
      email,
      callbackURL: callback,
      newUserCallbackURL: callback,
      errorCallbackURL: appPath("/sign-in/one-time?error=That%20link%20is%20invalid%20or%20expired.%20Request%20a%20new%20one."),
    },
    headers: await requestHeaders(reqHeaders),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (newPassword.length < 8) {
    throw new Error("Use at least 8 characters for your password.");
  }
  const requestHeaders = await headers();
  await getAuth().api.resetPassword({ body: { token, newPassword }, headers: requestHeaders });
}

const FRIENDLY: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password do not match.",
  USER_ALREADY_EXISTS: "An account with that email already exists. Sign in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with that email already exists. Sign in instead.",
  INVALID_TOKEN: "That link is invalid or expired. Request a new one.",
  PASSWORD_TOO_SHORT: "Use at least 8 characters for your password.",
  EMAIL_NOT_VERIFIED: "Check your email to verify your address first.",
  USER_NOT_FOUND: "No account found for that email.",
};

export function authErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    const code = (error.body as { code?: string } | undefined)?.code;
    if (code && FRIENDLY[code]) {
      return FRIENDLY[code];
    }
    return error.message || "Something went wrong. Try again.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Try again.";
}

export { ensureDefaultCookbook } from "@/lib/default-cookbook";
