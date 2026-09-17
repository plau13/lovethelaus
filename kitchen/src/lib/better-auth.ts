import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { createId } from "@paralleldrive/cuid2";
import { createDb, schema } from "@/db/client";
import { ensureDefaultCookbook } from "@/lib/default-cookbook";
import { acceptPendingInvitesForEmail } from "@/lib/cookbooks";
import { sendMagicLinkEmail, sendPasswordResetEmail } from "@/lib/email-templates";
import { appOrigin } from "@/lib/paths";
import { splitDisplayName } from "@/lib/user-name";

/** Better Auth routes are mounted here (site-relative, includes the Next basePath). */
export const AUTH_BASE_PATH = "/kitchen/api/auth";
export const COOKIE_PREFIX = "kitchen";

/** Session cookie cache lifetime in seconds. Refresh after user mutations via `refreshSessionCache()`. */
export const SESSION_CACHE_MAX_AGE = 5 * 60;

const optionalString = { type: "string", required: false, input: false } as const;
const optionalDate = { type: "date", required: false, input: false } as const;

function build() {
  const origin = appOrigin();
  return betterAuth({
    appName: "Kitchen",
    baseURL: origin, // bare origin; a path here would override basePath
    basePath: AUTH_BASE_PATH,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: Array.from(new Set([origin, "http://localhost:4321", "http://localhost:3000", "http://localhost:8787"])),
    database: drizzleAdapter(createDb(), { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      autoSignIn: true,
      resetPasswordTokenExpiresIn: 60 * 60,
      sendResetPassword: async ({ user, url }) => {
        await sendPasswordResetEmail(user.email, url);
      },
    },
    plugins: [
      magicLink({
        expiresIn: 15 * 60,
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail(email, url);
        },
      }),
      // Must stay last: lets auth.api.* set cookies from server actions and route handlers.
      nextCookies(),
    ],
    user: {
      additionalFields: {
        firstName: { type: "string", required: false, defaultValue: "", input: false },
        lastName: { type: "string", required: false, defaultValue: "", input: false },
        defaultServings: { type: "number", required: false, defaultValue: 4, input: false },
        preferredUnits: { type: "string", required: false, defaultValue: "us", input: false },
        onboardingCompletedAt: optionalDate,
        onboardingAnswers: { type: "string", required: false, defaultValue: "{}", input: false, returned: false },
        subscriptionTier: { type: "string", required: false, defaultValue: "free", input: false },
        socialImportCount: { type: "number", required: false, defaultValue: 0, input: false },
        socialImportPeriodStart: optionalDate,
        socialImportPeriodCount: { type: "number", required: false, defaultValue: 0, input: false },
        stripeCustomerId: { ...optionalString, returned: false },
        stripeSubscriptionId: { ...optionalString, returned: false },
        subscriptionStatus: optionalString,
        currentPeriodEnd: optionalDate,
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (incoming) => {
            const email = incoming.email.trim().toLowerCase();
            const name = (incoming.name || "").trim() || email.split("@")[0] || "Family cook";
            return { data: { ...incoming, email, name, ...splitDisplayName(name) } };
          },
          after: async (created) => {
            await ensureDefaultCookbook(created.id, created.name);
            await acceptPendingInvitesForEmail(created.id, created.email);
          },
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: SESSION_CACHE_MAX_AGE, strategy: "compact" },
    },
    advanced: {
      cookiePrefix: COOKIE_PREFIX,
      database: { generateId: () => createId() },
    },
  });
}

let instance: ReturnType<typeof build> | undefined;

/** Lazy singleton: never construct at module scope (build and cold isolates must not need env). */
export function getAuth() {
  return (instance ??= build());
}

export type Auth = ReturnType<typeof build>;
export type SessionUser = Auth["$Infer"]["Session"]["user"];
