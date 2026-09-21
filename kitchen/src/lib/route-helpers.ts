import { NextResponse } from "next/server";
import { userSafeMessage } from "@/lib/errors";
import { errorMessage, logWarn, reportError } from "@/lib/log";
import { appPath } from "@/lib/paths";
import { safeReturnTo, withQuery } from "@/lib/post-auth";

/** Absolute URL on the request origin for a site-relative path. */
export function originUrl(request: Request, path: string): URL {
  return new URL(path.startsWith("/") ? path : `/${path}`, new URL(request.url).origin);
}

/** Redirect and attach Set-Cookie headers returned by a Better Auth API call. */
export function redirectWithCookies(request: Request, path: string, setCookies: string[] = []): NextResponse {
  const response = NextResponse.redirect(originUrl(request, path), 303);
  for (const cookie of setCookies) {
    response.headers.append("set-cookie", cookie);
  }
  return response;
}

/** Where a marketing/Kitchen form should land on error or success (site-relative, validated). */
export function formReturnTo(formData: FormData, fallback: string): string {
  return safeReturnTo(String(formData.get("returnTo") ?? "")) ?? fallback;
}

type ErrorRedirectOptions = {
  /** When false, log to Cloudflare only (expected auth failures). Default true (Sentry + Cloudflare). */
  report?: boolean;
};

export function errorRedirect(
  request: Request,
  returnTo: string,
  error: unknown,
  event: string,
  options?: ErrorRedirectOptions
): NextResponse {
  if (options?.report === false) {
    logWarn(event, { detail: errorMessage(error) });
  } else {
    reportError(event, error);
  }
  return NextResponse.redirect(originUrl(request, withQuery(returnTo, "error", userSafeMessage(error))), 303);
}

export { appPath, withQuery };
