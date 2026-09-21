import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { periodEndFromSeconds, tierFromSubscriptionStatus } from "@/lib/billing";
import { errorMessage, logError, reportError } from "@/lib/log";
import { getStripe, webhookCryptoProvider } from "@/lib/stripe";

export const dynamic = "force-dynamic";

async function applySubscription(customerId: string, subscription: Stripe.Subscription): Promise<void> {
  const db = getDb();
  const item = subscription.items.data[0];
  await db
    .update(schema.user)
    .set({
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      currentPeriodEnd: periodEndFromSeconds(item?.current_period_end),
      subscriptionTier: tierFromSubscriptionStatus(subscription.status),
    })
    .where(eq(schema.user.stripeCustomerId, customerId));
}

function customerIdOf(value: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!value) {
    return null;
  }
  return typeof value === "string" ? value : value.id;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    logError("stripe.webhook.not_configured");
    return new Response("Webhook not configured", { status: 500 });
  }
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(payload, signature, secret, undefined, webhookCryptoProvider);
  } catch (error) {
    // Indistinguishable from a forged request at the status code, and the
    // likeliest cause is far more mundane: the signing secret was rotated on
    // one side only. Without this line the symptom is a payment that succeeds
    // while the account stays on the free tier, and nothing to read.
    logError("stripe.webhook.bad_signature", {
      hasSignature: signature.length > 0,
      detail: errorMessage(error),
    });
    return new Response("Bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerId = customerIdOf(session.customer);
        if (session.mode === "subscription" && customerId && session.subscription) {
          const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
          await applySubscription(customerId, subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = customerIdOf(subscription.customer);
        if (customerId) {
          await applySubscription(customerId, subscription);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    reportError("stripe.webhook.handler_failed", error, { eventType: event.type });
    return new Response("Handler error", { status: 500 });
  }

  return Response.json({ received: true });
}
