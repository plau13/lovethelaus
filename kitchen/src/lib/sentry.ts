import type { LogFields } from "@/lib/log";

type CaptureContext = {
  event: string;
  userId?: string;
  fields?: LogFields;
};

function dsnConfigured(): boolean {
  return Boolean(process.env.SENTRY_DSN?.trim());
}

let initPromise: Promise<void> | null = null;

async function ensureSentry(): Promise<void> {
  if (!dsnConfigured()) {
    return;
  }
  if (!initPromise) {
    initPromise = (async () => {
      const Sentry = await import("@sentry/nextjs");
      Sentry.init({
        dsn: process.env.SENTRY_DSN!.trim(),
        environment: process.env.SENTRY_ENVIRONMENT?.trim() || process.env.NODE_ENV || "development",
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
        sendDefaultPii: false,
        beforeSend(event) {
          if (event.request?.cookies) {
            delete event.request.cookies;
          }
          if (event.request?.headers) {
            const headers = { ...event.request.headers };
            delete headers.cookie;
            delete headers.authorization;
            event.request.headers = headers;
          }
          return event;
        },
      });
    })().catch(() => {
      initPromise = null;
    });
  }
  await initPromise;
}

/** Send an exception to Sentry when DSN is configured. Fire-and-forget on the server. */
export function captureException(error: unknown, context: CaptureContext): void {
  if (!dsnConfigured()) {
    return;
  }
  void ensureSentry()
    .then(async () => {
      const Sentry = await import("@sentry/nextjs");
      Sentry.withScope((scope) => {
        scope.setTag("event", context.event);
        if (context.userId) {
          scope.setUser({ id: context.userId });
        }
        if (context.fields) {
          for (const [key, value] of Object.entries(context.fields)) {
            if (value !== undefined && value !== null) {
              scope.setExtra(key, value);
            }
          }
        }
        Sentry.captureException(error);
      });
    })
    .catch(() => {
      // Sentry must never break the request path.
    });
}
