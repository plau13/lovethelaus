import Stripe from "stripe";

let client: Stripe | undefined;

/** Lazy Stripe client using the fetch transport (works on Cloudflare Workers and Node). */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("Billing is not configured (STRIPE_SECRET_KEY is missing).");
  }
  return (client ??= new Stripe(key, { httpClient: Stripe.createFetchHttpClient() }));
}

/** Kitchen Plus is sold monthly or annually; the two map to two Stripe prices. */
export const BILLING_INTERVALS = ["monthly", "yearly"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export function isBillingInterval(value: string): value is BillingInterval {
  return (BILLING_INTERVALS as readonly string[]).includes(value);
}

function priceEnv(interval: BillingInterval): string | undefined {
  return interval === "monthly"
    ? process.env.STRIPE_PRICE_KITCHEN_PLUS_MONTHLY?.trim()
    : process.env.STRIPE_PRICE_KITCHEN_PLUS_YEARLY?.trim();
}

/** Billing needs a key and at least one price; a missing interval just hides that option. */
export function isBillingConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() && BILLING_INTERVALS.some((interval) => priceEnv(interval)),
  );
}

export function availableIntervals(): BillingInterval[] {
  return BILLING_INTERVALS.filter((interval) => Boolean(priceEnv(interval)));
}

export function kitchenPlusPriceId(interval: BillingInterval): string {
  const price = priceEnv(interval);
  if (!price) {
    throw new Error(`Billing is not configured for the ${interval} plan.`);
  }
  return price;
}

/** WebCrypto-based signature verification for `constructEventAsync` (Workers have no Node crypto sync API). */
export const webhookCryptoProvider = Stripe.createSubtleCryptoProvider();
