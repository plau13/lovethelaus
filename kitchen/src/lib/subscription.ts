export const SUBSCRIPTION_TIERS = ["free", "subscriber"] as const;

export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export const FREE_SOCIAL_IMPORT_LIMIT = 3;
export const SUBSCRIBER_SOCIAL_IMPORT_MONTHLY_LIMIT = 10;

export type UserSubscriptionFields = {
  subscriptionTier: string;
  socialImportCount: number;
  socialImportPeriodStart: Date | null;
  socialImportPeriodCount: number;
};

export function isSubscriber(user: { subscriptionTier: string }): boolean {
  return user.subscriptionTier === "subscriber";
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function socialImportRemaining(user: UserSubscriptionFields): number | null {
  if (isSubscriber(user)) {
    const monthStart = startOfUtcMonth(new Date());
    const periodStart = user.socialImportPeriodStart;
    const count =
      periodStart && periodStart >= monthStart ? user.socialImportPeriodCount : 0;
    return Math.max(0, SUBSCRIBER_SOCIAL_IMPORT_MONTHLY_LIMIT - count);
  }
  return Math.max(0, FREE_SOCIAL_IMPORT_LIMIT - user.socialImportCount);
}

export function canStartSocialImport(user: UserSubscriptionFields): boolean {
  const remaining = socialImportRemaining(user);
  return remaining !== null && remaining > 0;
}

export function isSocialSource(sourceType: string): boolean {
  return sourceType === "instagram" || sourceType === "tiktok";
}

export type SocialImportIncrement = {
  socialImportCount?: number;
  socialImportPeriodStart?: Date;
  socialImportPeriodCount?: number;
};

export function socialImportIncrement(user: UserSubscriptionFields): SocialImportIncrement {
  if (isSubscriber(user)) {
    const now = new Date();
    const monthStart = startOfUtcMonth(now);
    const periodStart = user.socialImportPeriodStart;
    if (!periodStart || periodStart < monthStart) {
      return { socialImportPeriodStart: monthStart, socialImportPeriodCount: 1 };
    }
    return { socialImportPeriodCount: user.socialImportPeriodCount + 1 };
  }
  return { socialImportCount: user.socialImportCount + 1 };
}
