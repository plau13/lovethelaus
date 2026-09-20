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

/** Keys whose values are never safe to log, however they are spelled. */
const UNSAFE_KEY = /secret|signature|token|password|authorization|cookie|payload|apikey|api_key/i;

/** Long values are almost always a body or a blob that was never meant to be here. */
const MAX_VALUE_LENGTH = 200;

export type LogFields = Record<string, string | number | boolean | null | undefined>;

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

/** The line that reaches Workers Logs. Pure, so the redaction rules are testable. */
export function logLine(level: "warn" | "error", event: string, fields: LogFields = {}): string {
  return JSON.stringify({ level, event, ...safeFields(fields) });
}

/** Something is wrong but the request was handled; someone should look. */
export function logWarn(event: string, fields: LogFields = {}): void {
  console.warn(logLine("warn", event, fields));
}

/** Something is broken: a payment not recorded, an object missing from R2. */
export function logError(event: string, fields: LogFields = {}): void {
  console.error(logLine("error", event, fields));
}

/** An unknown `catch` binding, reduced to something worth logging. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
