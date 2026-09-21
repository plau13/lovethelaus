import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";
import { isUnsafeFieldKey, sentryBeforeBreadcrumb, sentryBeforeSend } from "./sentry-shared";

describe("sentry-shared", () => {
  it("flags credential-shaped field keys", () => {
    expect(isUnsafeFieldKey("stripeSignature")).toBe(true);
    expect(isUnsafeFieldKey("eventType")).toBe(false);
  });

  it("strips cookies and authorization from beforeSend", () => {
    const event = sentryBeforeSend(
      {
        request: {
          cookies: { session: "abc" },
          headers: { cookie: "x", authorization: "Bearer y", accept: "json" },
        },
      } as unknown as ErrorEvent,
      {},
    );
    expect(event?.request?.cookies).toBeUndefined();
    expect(event?.request?.headers?.cookie).toBeUndefined();
    expect(event?.request?.headers?.authorization).toBeUndefined();
    expect(event?.request?.headers?.accept).toBe("json");
  });

  it("redacts unsafe breadcrumb data keys", () => {
    const crumb = sentryBeforeBreadcrumb({
      category: "auth",
      data: { outcome: "success", apiKey: "secret" },
    });
    expect(crumb?.data).toEqual({ outcome: "success" });
  });
});
