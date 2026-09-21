import type { ErrorEvent, EventHint } from "@sentry/nextjs";
import { safeFields, type LogFields } from "@/lib/log";

/** Keys whose values must not reach Sentry breadcrumbs or extras. */
const UNSAFE_KEY = /secret|signature|token|password|authorization|cookie|payload|apikey|api_key/i;

export function isUnsafeFieldKey(key: string): boolean {
  return UNSAFE_KEY.test(key);
}

export function getSentryRelease(client = false): string {
  const key = client ? "NEXT_PUBLIC_SENTRY_RELEASE" : "SENTRY_RELEASE";
  const fromEnv = process.env[key]?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  if (client) {
    return process.env.SENTRY_RELEASE?.trim() || "kitchen@unknown";
  }
  return "kitchen@unknown";
}

export function getSentryEnvironment(client = false): string {
  if (client) {
    return process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT?.trim() || process.env.NODE_ENV || "development";
  }
  return process.env.SENTRY_ENVIRONMENT?.trim() || process.env.NODE_ENV || "development";
}

export function getTracesSampleRate(): number {
  return process.env.NODE_ENV === "production" ? 0.1 : 1;
}

function scrubRecord(record: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!record) {
    return record;
  }
  const input: LogFields = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
      input[key] = value;
    }
  }
  return safeFields(input) as Record<string, unknown>;
}

export function sentryBeforeSend(event: ErrorEvent, _hint: EventHint): ErrorEvent | null {
  if (event.request?.cookies) {
    delete event.request.cookies;
  }
  if (event.request?.headers) {
    const headers = { ...event.request.headers };
    delete headers.cookie;
    delete headers.authorization;
    event.request.headers = headers;
  }
  if (event.extra) {
    event.extra = scrubRecord(event.extra as Record<string, unknown>);
  }
  if (event.contexts) {
    for (const [name, ctx] of Object.entries(event.contexts)) {
      if (ctx && typeof ctx === "object") {
        event.contexts[name] = scrubRecord(ctx as Record<string, unknown>);
      }
    }
  }
  return event;
}

export function sentryBeforeBreadcrumb(breadcrumb: {
  category?: string;
  message?: string;
  data?: Record<string, unknown>;
}): typeof breadcrumb | null {
  if (!breadcrumb.data) {
    return breadcrumb;
  }
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(breadcrumb.data)) {
    if (isUnsafeFieldKey(key)) {
      continue;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
      safe[key] = value;
    }
  }
  breadcrumb.data = safe;
  return breadcrumb;
}

export function baseSentryInitOptions(dsn: string, client = false) {
  return {
    dsn,
    environment: getSentryEnvironment(client),
    release: getSentryRelease(client),
    tracesSampleRate: getTracesSampleRate(),
    sendDefaultPii: false,
    beforeSend: sentryBeforeSend,
    beforeBreadcrumb: sentryBeforeBreadcrumb,
  };
}
