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

export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_PRICE_KITCHEN_PLUS?.trim());
}

export function kitchenPlusPriceId(): string {
  const price = process.env.STRIPE_PRICE_KITCHEN_PLUS?.trim();
  if (!price) {
    throw new Error("Billing is not configured (STRIPE_PRICE_KITCHEN_PLUS is missing).");
  }
  return price;
}

/** WebCrypto-based signature verification for `constructEventAsync` (Workers have no Node crypto sync API). */
export const webhookCryptoProvider = Stripe.createSubtleCryptoProvider();
