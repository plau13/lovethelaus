import type { LogFields } from "@/lib/log";
import { safeFields } from "@/lib/log";

function clientDsnConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim());
}

function serverDsnConfigured(): boolean {
  return Boolean(process.env.SENTRY_DSN?.trim());
}

/** Add a scrubbed breadcrumb when Sentry is configured (client or server). */
export function breadcrumb(category: string, data?: LogFields): void {
  const fields = data ? safeFields(data) : undefined;
  if (typeof window !== "undefined") {
    if (!clientDsnConfigured()) {
      return;
    }
    void import("@sentry/nextjs").then((Sentry) => {
      Sentry.addBreadcrumb({ category, data: fields });
    });
    return;
  }
  if (!serverDsnConfigured()) {
    return;
  }
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.addBreadcrumb({ category, data: fields });
  });
}
