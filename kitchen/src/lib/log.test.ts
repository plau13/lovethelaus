import { describe, expect, it } from "vitest";
import { errorMessage, logLine, safeFields } from "./log";

describe("safeFields", () => {
  it("keeps ordinary diagnostic values", () => {
    expect(safeFields({ eventType: "checkout.session.completed", attempt: 2, configured: false })).toEqual({
      eventType: "checkout.session.completed",
      attempt: 2,
      configured: false,
    });
  });

  it("keeps a boolean even under a credential-shaped name, since one bit is not a secret", () => {
    expect(safeFields({ hasSignature: true, secretConfigured: false })).toEqual({
      hasSignature: true,
      secretConfigured: false,
    });
  });

  it("redacts anything whose name suggests a credential", () => {
    const fields = safeFields({
      stripeSignature: "t=1,v1=abc",
      webhook_secret: "whsec_live",
      Authorization: "Bearer x",
      payload: "{...}",
      apiKey: "sk-ant-x",
    });
    expect(Object.values(fields).every((value) => value === "[redacted]")).toBe(true);
  });

  it("drops undefined so an absent field is absent, not null", () => {
    expect(safeFields({ present: "yes", missing: undefined })).toEqual({ present: "yes" });
  });

  it("keeps an explicit null, which means 'looked and found nothing'", () => {
    expect(safeFields({ userId: null })).toEqual({ userId: null });
  });

  it("truncates a value long enough to be a body that slipped through", () => {
    const value = safeFields({ detail: "x".repeat(500) }).detail as string;
    expect(value).toHaveLength(201); // 200 characters plus the ellipsis
    expect(value.endsWith("…")).toBe(true);
  });
});

describe("logLine", () => {
  it("is one JSON object with the level and event first", () => {
    const line = logLine("error", "stripe.webhook.bad_signature", { hasSignature: true });
    expect(JSON.parse(line)).toEqual({
      level: "error",
      event: "stripe.webhook.bad_signature",
      hasSignature: true,
    });
    expect(line).not.toContain("\n");
  });

  it("redacts through logLine too, not only through safeFields", () => {
    expect(logLine("warn", "x", { secret: "whsec_live" })).toBe('{"level":"warn","event":"x","secret":"[redacted]"}');
  });
});

describe("errorMessage", () => {
  it("prefers the message of a real Error", () => {
    expect(errorMessage(new Error("no such bucket"))).toBe("no such bucket");
  });

  it("copes with whatever else a catch binding holds", () => {
    expect(errorMessage("string throw")).toBe("string throw");
    expect(errorMessage(undefined)).toBe("undefined");
  });
});
