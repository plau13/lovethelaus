import type { SubscriptionTier } from "@/lib/subscription";

/** Stripe subscription statuses that keep Kitchen Plus features on. */
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

export function tierFromSubscriptionStatus(status: string | null | undefined): SubscriptionTier {
  return status && ACTIVE_STATUSES.has(status) ? "subscriber" : "free";
}

export type BillingUser = {
  subscriptionTier: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
};

export type SubscriptionSummary = {
  planLabel: "Kitchen Plus" | "Free";
  statusLine: string;
};

export function subscriptionSummary(user: BillingUser, now: Date = new Date()): SubscriptionSummary {
  const plus = user.subscriptionTier === "subscriber";
  if (!plus) {
    return { planLabel: "Free", statusLine: "Subscribe to export shared recipes and cook offline." };
  }
  const end = user.currentPeriodEnd;
  const endLabel = end ? end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;
  if (user.subscriptionStatus === "past_due") {
    return { planLabel: "Kitchen Plus", statusLine: "Your last payment failed. Update your card to keep Kitchen Plus." };
  }
  if (user.subscriptionStatus === "trialing" && endLabel) {
    return { planLabel: "Kitchen Plus", statusLine: `Trial ends ${endLabel}.` };
  }
  if (endLabel && end && end > now) {
    return { planLabel: "Kitchen Plus", statusLine: `Renews ${endLabel}.` };
  }
  return { planLabel: "Kitchen Plus", statusLine: "Offline cook mode and shared-recipe export are on." };
}

/** Unix seconds → Date, or null. */
export function periodEndFromSeconds(seconds: number | null | undefined): Date | null {
  return typeof seconds === "number" && Number.isFinite(seconds) ? new Date(seconds * 1000) : null;
}
