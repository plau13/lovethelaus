import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { userSafeMessage } from "@/lib/errors";
import { errorMessage, logWarn, reportError } from "@/lib/log";
import { withQuery } from "@/lib/post-auth";

export type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

type ActionErrorOptions = {
  /** When false, log to Cloudflare only (expected auth failures). Default true (Sentry + Cloudflare). */
  report?: boolean;
};

export function actionOk<T = void>(data?: T): ActionResult<T> {
  return data === undefined ? { ok: true } : { ok: true, data };
}

export function actionFail(
  error: unknown,
  event: string,
  userId?: string,
  options?: ActionErrorOptions,
): ActionResult {
  if (isRedirectError(error)) {
    throw error;
  }
  const fields = userId ? { userId } : undefined;
  if (options?.report === false) {
    logWarn(event, { detail: errorMessage(error), ...fields });
  } else {
    reportError(event, error, fields);
  }
  return { ok: false, error: userSafeMessage(error) };
}

/** Full-page form failure: log, sanitize, redirect with ?error=. */
export function redirectActionError(
  path: string,
  error: unknown,
  event: string,
  userId?: string,
  options?: ActionErrorOptions,
): never {
  if (isRedirectError(error)) {
    throw error;
  }
  const fields = userId ? { userId } : undefined;
  if (options?.report === false) {
    logWarn(event, { detail: errorMessage(error), ...fields });
  } else {
    reportError(event, error, fields);
  }
  redirect(withQuery(path, "error", userSafeMessage(error)));
}
