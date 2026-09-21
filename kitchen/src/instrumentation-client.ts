import * as Sentry from "@sentry/nextjs";
import { baseSentryInitOptions } from "@/lib/sentry-shared";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

if (dsn) {
  Sentry.init({
    ...baseSentryInitOptions(dsn, true),
    integrations: [
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
      Sentry.feedbackIntegration({ colorScheme: "system" }),
    ],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
