/**
 * Structured logging for the failures that otherwise leave no trace.
 *
 * Workers Logs keeps everything this Worker writes (sampling is 1, see
 * `wrangler.jsonc`), so the gap was never collection — it was that several
 * failure paths returned a status code and said nothing about why. A 400 from
 * the Stripe webhook looks identical whether the signature was forged or the
 * secret was simply rotated on one side only.
 *
 * One JSON object per line, so the dashboard can filter on `event`.
 *
 * **Never pass a request body, a signature, a token or a key.** `safeFields`
 * drops the obvious ones, but it is a backstop for mistakes, not a licence to
 * throw whole objects at it: a field it does not recognize goes to the log
 * verbatim, and Workers Logs is readable by anyone with dashboard access.
 */

import { requestLogContext, type RequestLogContext } from "@/lib/worker-context";

/** Keys whose values are never safe to log, however they are spelled. */
const UNSAFE_KEY = /secret|signature|token|password|authorization|cookie|payload|apikey|api_key/i;

/** Long values are almost always a body or a blob that was never meant to be here. */
const MAX_VALUE_LENGTH = 200;

export type LogFields = Record<string, string | number | boolean | null | undefined>;

export function isUnsafeFieldKey(key: string): boolean {
  return UNSAFE_KEY.test(key);
}

/** Drops values that must not be logged and truncates ones that are suspiciously long. */
export function safeFields(fields: LogFields): LogFields {
  const safe: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) {
      continue;
    }
    // A boolean carries one bit and cannot be a credential, so `hasSignature`
    // survives while `stripeSignature` does not. Without this exemption the
    // redactor strips the very flags these logs exist to record.
    if (UNSAFE_KEY.test(key) && typeof value !== "boolean") {
      safe[key] = "[redacted]";
      continue;
    }
    safe[key] = typeof value === "string" && value.length > MAX_VALUE_LENGTH ? `${value.slice(0, MAX_VALUE_LENGTH)}…` : value;
  }
  return safe;
}

function mergeContext(fields: LogFields, context?: RequestLogContext): LogFields {
  if (!context) {
    return fields;
  }
  const merged: LogFields = { ...fields };
  if (context.cfRay) {
    merged.cfRay = context.cfRay;
  }
  if (context.requestId) {
    merged.requestId = context.requestId;
  }
  if (context.route) {
    merged.route = context.route;
  }
  if (context.method) {
    merged.method = context.method;
  }
  return merged;
}

/** The line that reaches Workers Logs. Pure, so the redaction rules are testable. */
export function logLine(level: "warn" | "error", event: string, fields: LogFields = {}, context?: RequestLogContext): string {
  return JSON.stringify({ level, event, ...safeFields(mergeContext(fields, context)) });
}

/** Something is wrong but the request was handled; someone should look. */
export function logWarn(event: string, fields: LogFields = {}, context?: RequestLogContext): void {
  console.warn(logLine("warn", event, fields, context));
}

/** Something is broken: a payment not recorded, an object missing from R2. */
export function logError(event: string, fields: LogFields = {}, context?: RequestLogContext): void {
  console.error(logLine("error", event, fields, context));
}

/** An unknown `catch` binding, reduced to something worth logging. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Log a failure to Cloudflare and Sentry. Use for errors worth triage, not routine warns. */
export function reportError(
  event: string,
  error: unknown,
  fields: LogFields = {},
  context?: RequestLogContext,
  request?: Request,
): void {
  const detail = errorMessage(error);
  logError(event, { ...fields, detail }, context);
  void import("@/lib/sentry").then(({ captureException }) => {
    captureException(error, {
      event,
      userId: typeof fields.userId === "string" ? fields.userId : undefined,
      fields: safeFields(fields),
      request,
    });
  });
}

/** reportError with request correlation from an incoming Request. */
export function reportRequestError(event: string, error: unknown, request: Request, fields: LogFields = {}): void {
  reportError(event, error, fields, requestLogContext(request), request);
}
