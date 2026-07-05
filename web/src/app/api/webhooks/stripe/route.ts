import { headers } from "next/headers";
import Stripe from "stripe";
import { logEvent } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { constructStripeEvent } from "@/lib/stripe";

function isPremiumSubscriptionStatus(status: Stripe.Subscription.Status) {
  return status === "active" || status === "trialing";
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = constructStripeEvent(body, signature);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (userId && subscriptionId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            tier: "PREMIUM",
            stripeSubscriptionId: subscriptionId,
          },
        });
        void logEvent("subscription_active", {
          userId,
          metadata: { subscriptionId },
        });
      }
      break;
    }
    case "customer.subscription.deleted":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (user) {
        const isActive = isPremiumSubscriptionStatus(subscription.status);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            tier: isActive ? "PREMIUM" : "FREE",
            stripeSubscriptionId: isActive ? subscription.id : null,
          },
        });
        void logEvent(isActive ? "subscription_active" : "subscription_cancelled", {
          userId: user.id,
          metadata: { status: subscription.status },
        });
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

      if (!customerId) break;

      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { tier: "FREE" },
        });
      }
      break;
    }
  }

  return new Response("OK", { status: 200 });
}
