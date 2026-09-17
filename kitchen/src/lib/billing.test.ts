import { describe, expect, it } from "vitest";
import { periodEndFromSeconds, subscriptionSummary, tierFromSubscriptionStatus } from "./billing";

describe("tierFromSubscriptionStatus", () => {
  it("maps live statuses to subscriber", () => {
    for (const status of ["active", "trialing", "past_due"]) {
      expect(tierFromSubscriptionStatus(status)).toBe("subscriber");
    }
  });

  it("maps everything else to free", () => {
    for (const status of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused", null, undefined, ""]) {
      expect(tierFromSubscriptionStatus(status)).toBe("free");
    }
  });
});

describe("subscriptionSummary", () => {
  const now = new Date("2026-09-17T00:00:00Z");

  it("describes a free account", () => {
    expect(subscriptionSummary({ subscriptionTier: "free", subscriptionStatus: null, currentPeriodEnd: null }, now).planLabel).toBe("Free");
  });

  it("shows the renewal date for an active plan", () => {
    const summary = subscriptionSummary(
      { subscriptionTier: "subscriber", subscriptionStatus: "active", currentPeriodEnd: new Date("2026-10-17T00:00:00Z") },
      now
    );
    expect(summary.planLabel).toBe("Kitchen Plus");
    expect(summary.statusLine).toContain("Renews");
  });

  it("warns on past_due", () => {
    const summary = subscriptionSummary({ subscriptionTier: "subscriber", subscriptionStatus: "past_due", currentPeriodEnd: null }, now);
    expect(summary.statusLine).toContain("payment failed");
  });
});

describe("periodEndFromSeconds", () => {
  it("converts unix seconds", () => {
    expect(periodEndFromSeconds(1_700_000_000)?.toISOString()).toBe("2023-11-14T22:13:20.000Z");
    expect(periodEndFromSeconds(null)).toBeNull();
    expect(periodEndFromSeconds(Number.NaN)).toBeNull();
  });
});
