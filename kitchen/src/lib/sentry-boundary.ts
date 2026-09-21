import * as Sentry from "@sentry/nextjs";
import { getSentryRelease } from "@/lib/sentry-shared";

/** Shared capture logic for React error boundaries. */
export function captureBoundaryError(error: Error & { digest?: string }, eventTag: string): void {
  Sentry.withScope((scope) => {
    scope.setTag("event", eventTag);
    scope.setTag("release", getSentryRelease(true));
    if (error.digest) {
      scope.setTag("digest", error.digest);
      scope.setExtra("digest", error.digest);
    }
    Sentry.captureException(error);
  });
}
