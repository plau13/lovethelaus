import type { LogFields } from "@/lib/log";
import { baseSentryInitOptions, getSentryRelease } from "@/lib/sentry-shared";
import { requestLogContext } from "@/lib/worker-context";

type CaptureContext = {
  event: string;
  userId?: string;
  fields?: LogFields;
  request?: Request;
};

function dsnConfigured(): boolean {
  return Boolean(process.env.SENTRY_DSN?.trim());
}

let initPromise: Promise<void> | null = null;
let processHooksRegistered = false;

function registerProcessHooks(): void {
  if (processHooksRegistered || typeof process === "undefined") {
    return;
  }
  processHooksRegistered = true;
  process.on?.("uncaughtException", (error) => {
    captureException(error, { event: "worker.uncaught_exception" });
  });
  process.on?.("unhandledRejection", (reason) => {
    captureException(reason, { event: "worker.unhandled_rejection" });
  });
}

async function ensureSentry(): Promise<void> {
  if (!dsnConfigured()) {
    return;
  }
  if (!initPromise) {
    initPromise = (async () => {
      const Sentry = await import("@sentry/nextjs");
      Sentry.init(baseSentryInitOptions(process.env.SENTRY_DSN!.trim()));
      registerProcessHooks();
    })().catch(() => {
      initPromise = null;
    });
  }
  await initPromise;
}

function applyScopeTags(
  scope: { setTag: (key: string, value: string) => void; setUser: (user: { id: string } | null) => void; setExtra: (key: string, value: unknown) => void },
  context: CaptureContext,
): void {
  scope.setTag("event", context.event);
  scope.setTag("release", getSentryRelease());
  if (context.userId) {
    scope.setUser({ id: context.userId });
  }
  if (context.request) {
    const reqCtx = requestLogContext(context.request);
    if (reqCtx.route) {
      scope.setTag("route", reqCtx.route);
    }
    if (reqCtx.cfRay) {
      scope.setTag("cf_ray", reqCtx.cfRay);
    }
    if (reqCtx.requestId) {
      scope.setTag("request_id", reqCtx.requestId);
    }
    if (reqCtx.method) {
      scope.setExtra("method", reqCtx.method);
    }
  }
  if (context.fields) {
    for (const [key, value] of Object.entries(context.fields)) {
      if (value !== undefined && value !== null) {
        scope.setExtra(key, value);
      }
    }
  }
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
        applyScopeTags(scope, context);
        Sentry.captureException(error);
      });
    })
    .catch(() => {
      // Sentry must never break the request path.
    });
}

/** Flush pending Sentry events (use from worker waitUntil). */
export async function flushSentry(timeoutMs = 2000): Promise<void> {
  if (!dsnConfigured()) {
    return;
  }
  await ensureSentry();
  const Sentry = await import("@sentry/nextjs");
  await Sentry.flush(timeoutMs);
}
