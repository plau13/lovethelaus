import { boolean, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const createdAt = () => ts("created_at").notNull().defaultNow();
const updatedAt = () =>
  ts("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/**
 * Better Auth core `user` table. This IS the app user: every app table keys off `user.id`.
 * The extra columns are declared to Better Auth as `additionalFields` in src/lib/better-auth.ts.
 */
export const user = pgTable(
  "user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),

    // Profile
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    defaultServings: integer("default_servings").notNull().default(4),
    preferredUnits: text("preferred_units").notNull().default("us"),
    onboardingCompletedAt: ts("onboarding_completed_at"),
    onboardingAnswers: text("onboarding_answers").notNull().default("{}"),

    // Plan + quotas
    subscriptionTier: text("subscription_tier").notNull().default("free"),
    socialImportCount: integer("social_import_count").notNull().default(0),
    socialImportPeriodStart: ts("social_import_period_start"),
    socialImportPeriodCount: integer("social_import_period_count").notNull().default(0),

    // Billing (Stripe)
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripeSubscriptionId: text("stripe_subscription_id"),
    subscriptionStatus: text("subscription_status"),
    currentPeriodEnd: ts("current_period_end"),
  },
  (t) => [index("user_email_idx").on(t.email)]
);

export const session = pgTable(
  "session",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: ts("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("session_user_idx").on(t.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: ts("access_token_expires_at"),
    refreshTokenExpiresAt: ts("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("account_user_idx").on(t.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: ts("expires_at").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)]
);
