import { APIError } from "better-auth/api";

/** Thrown when the message is safe to show the person using the app. */
export class AppError extends Error {
  readonly event: string;

  constructor(event: string, userMessage: string, options?: { cause?: unknown }) {
    super(userMessage, { cause: options?.cause });
    this.name = "AppError";
    this.event = event;
  }
}

export const AUTH_FRIENDLY: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password do not match.",
  USER_ALREADY_EXISTS: "An account with that email already exists. Sign in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with that email already exists. Sign in instead.",
  INVALID_TOKEN: "That link is invalid or expired. Request a new one.",
  PASSWORD_TOO_SHORT: "Use at least 8 characters for your password.",
  EMAIL_NOT_VERIFIED: "Check your email to verify your address first.",
  USER_NOT_FOUND: "No account found for that email.",
};

const GENERIC =
  "Something went wrong on our side. Try again in a moment.";

/** Patterns that must never reach the browser or a redirect URL. */
const INTERNAL_PATTERN =
  /failed query|select\s+"|insert into|update\s+"|delete from|column\s+"|relation\s+"|neon\.|postgres|drizzle|ECONNREFUSED|ENOTFOUND|timeout exceeded/i;

export function isInternalErrorMessage(message: string): boolean {
  return INTERNAL_PATTERN.test(message);
}

/** Map any caught value to text safe for query params and form alerts. */
export function userSafeMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof APIError) {
    const body = error.body as { code?: string; body?: { code?: string } } | undefined;
    const code = body?.code ?? body?.body?.code;
    if (code && AUTH_FRIENDLY[code]) {
      return AUTH_FRIENDLY[code];
    }
    const msg = error.message?.trim();
    if (msg && !isInternalErrorMessage(msg)) {
      return msg;
    }
    return "Something went wrong. Try again.";
  }
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (!msg) {
      return GENERIC;
    }
    if (isInternalErrorMessage(msg)) {
      return GENERIC;
    }
    return msg;
  }
  return GENERIC;
}
