import { z } from "zod";
import { logEvent } from "@/lib/analytics";
import { isPremium, requireCurrentUser } from "@/lib/auth";
import { askCoach, getChatHistory } from "@/lib/coach";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { assertCoachRateLimit, RateLimitError } from "@/lib/rateLimit";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const messages = await getChatHistory(user.id);
    return jsonOk({ messages, isPremium: isPremium(user) });
  } catch (error) {
    return handleApiError(error);
  }
}

const coachSchema = z.object({
  question: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();

    if (!isPremium(user)) {
      return jsonError(
        "AI Bible Coach is a Premium feature. Upgrade to unlock full access.",
        403,
      );
    }

    const { question } = coachSchema.parse(await request.json());
    await assertCoachRateLimit(user.id);
    const reply = await askCoach(user.id, question);

    void logEvent("coach", { userId: user.id });

    return jsonOk({ reply });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return jsonError(error.message, error.status);
    }
    return handleApiError(error);
  }
}
