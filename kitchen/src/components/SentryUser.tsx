"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/** Attach the signed-in user id to client Sentry events (no PII beyond id). */
export function SentryUser({ userId }: { userId: string | null }) {
  useEffect(() => {
    if (userId) {
      Sentry.setUser({ id: userId });
    } else {
      Sentry.setUser(null);
    }
  }, [userId]);

  return null;
}
