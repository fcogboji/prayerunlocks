import Stripe from "stripe";
import { prisma } from "./prisma";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-05-27.dahlia",
  });
}

export const PREMIUM_PRICE_USD = 499; // $4.99 in cents

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string | null,
) {
  const stripe = getStripe();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  name?: string | null,
) {
  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(userId, email, name);
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!priceId) {
    throw new Error("STRIPE_PRICE_ID not configured");
  }

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?cancelled=true`,
    metadata: { userId },
  });
}

export async function createBillingPortalSession(customerId: string) {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });
}

export function constructStripeEvent(
  body: string,
  signature: string,
): Stripe.Event {
  const stripe = getStripe();
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );
}
