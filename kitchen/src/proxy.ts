import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Cookie-presence guard only (no database access). Pages still enforce access with
 * `requireUser()`; this just bounces signed-out visitors to sign-in with a returnTo.
 * Paths here are basePath-relative (`/kitchen` is already stripped).
 */
const PROTECTED = [/^\/recipes(\/|$)/, /^\/cookbooks(\/|$)/, /^\/settings(\/|$)/, /^\/onboarding(\/|$)/, /^\/import(\/|$)/, /^\/interview(\/|$)/, /^\/loved-ones(\/|$)/, /^\/family(\/|$)/];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!PROTECTED.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }
  if (getSessionCookie(request, { cookiePrefix: "kitchen" })) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = "/sign-in";
  url.search = "";
  url.searchParams.set("returnTo", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|icon.svg|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
