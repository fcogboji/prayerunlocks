import { requireCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
import {
  createBillingPortalSession,
  createCheckoutSession,
} from "@/lib/stripe";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { action } = await request.json();

    if (action === "portal") {
      if (!user.stripeCustomerId) {
        return jsonError("No subscription found", 404);
      }
      const session = await createBillingPortalSession(user.stripeCustomerId);
      return jsonOk({ url: session.url });
    }

    const session = await createCheckoutSession(
      user.id,
      user.email,
      user.name,
    );

    void logEvent("checkout_started", { userId: user.id });

    return jsonOk({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
