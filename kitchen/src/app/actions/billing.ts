"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db/client";
import { refreshSessionCache, requireUser } from "@/lib/auth";
import { appUrl } from "@/lib/paths";
import { getStripe, isBillingInterval, kitchenPlusPriceId } from "@/lib/stripe";

async function ensureStripeCustomer(userId: string): Promise<string> {
  const db = getDb();
  const row = await db.query.user.findFirst({
    where: eq(schema.user.id, userId),
    columns: { id: true, email: true, name: true, stripeCustomerId: true },
  });
  if (!row) {
    throw new Error("Account not found.");
  }
  if (row.stripeCustomerId) {
    return row.stripeCustomerId;
  }
  const customer = await getStripe().customers.create({
    email: row.email,
    name: row.name,
    metadata: { userId: row.id },
  });
  await db.update(schema.user).set({ stripeCustomerId: customer.id }).where(eq(schema.user.id, row.id));
  return customer.id;
}

/** Settings → "Upgrade to Kitchen Plus", monthly or annual. */
export async function startCheckout(formData: FormData) {
  const user = await requireUser({ fresh: true });
  const raw = String(formData.get("interval") ?? "monthly");
  const interval = isBillingInterval(raw) ? raw : "monthly";
  const customer = await ensureStripeCustomer(user.id);
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price: kitchenPlusPriceId(interval), quantity: 1 }],
    client_reference_id: user.id,
    subscription_data: { metadata: { userId: user.id } },
    allow_promotion_codes: true,
    success_url: appUrl("/settings?checkout=success"),
    cancel_url: appUrl("/settings"),
  });
  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }
  redirect(session.url);
}

/** Settings → "Manage billing" (Stripe Customer Portal). */
export async function openBillingPortal() {
  const user = await requireUser({ fresh: true });
  const customer = await ensureStripeCustomer(user.id);
  const session = await getStripe().billingPortal.sessions.create({
    customer,
    return_url: appUrl("/settings"),
  });
  redirect(session.url);
}

/** After returning from Checkout, re-read the plan from the database into the session cookie. */
export async function refreshPlan() {
  await requireUser();
  await refreshSessionCache();
  redirect("/settings");
}
