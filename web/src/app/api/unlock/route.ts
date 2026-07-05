import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { assertCoachRateLimit, RateLimitError } from "@/lib/rateLimit";
import { unlockPrayerForSituation } from "@/lib/unlock";

const unlockRequestSchema = z.object({
  situation: z.string().min(3).max(2000),
});

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { situation } = unlockRequestSchema.parse(await request.json());

    await assertCoachRateLimit(user.id, 20);

    const unlock = await unlockPrayerForSituation(situation);

    await prisma.unlockRequest.create({
      data: {
        userId: user.id,
        situation,
        prayerType: unlock.prayerType,
        verses: JSON.stringify(unlock.verses.map((v) => v.reference)),
      },
    });

    void logEvent("unlock", {
      userId: user.id,
      metadata: { prayerType: unlock.prayerType },
    });

    return jsonOk({ unlock, situation });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return jsonError(error.message, error.status);
    }
    return handleApiError(error);
  }
}
