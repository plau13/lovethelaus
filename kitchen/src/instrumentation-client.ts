import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT?.trim() || process.env.NODE_ENV || "development",
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
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
