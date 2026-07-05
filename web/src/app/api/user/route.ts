import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";

const patchSchema = z.object({
  reminderEnabled: z.boolean().optional(),
  reminderHour: z.number().min(0).max(23).optional(),
  timezone: z.string().optional(),
  pushToken: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const user = await requireCurrentUser();
    return jsonOk({
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      inviteCode: user.inviteCode,
      reminderEnabled: user.reminderEnabled,
      reminderHour: user.reminderHour,
      hasPushToken: Boolean(user.pushToken),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = patchSchema.parse(await request.json());
    const { prisma } = await import("@/lib/prisma");

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        reminderEnabled: body.reminderEnabled ?? user.reminderEnabled,
        reminderHour: body.reminderHour ?? user.reminderHour,
        timezone: body.timezone ?? user.timezone,
        pushToken:
          body.pushToken === null
            ? null
            : (body.pushToken ?? user.pushToken),
      },
    });

    return jsonOk({
      id: updated.id,
      reminderEnabled: updated.reminderEnabled,
      reminderHour: updated.reminderHour,
      hasPushToken: Boolean(updated.pushToken),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
