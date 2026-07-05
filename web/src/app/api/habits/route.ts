import { HabitType } from "@prisma/client";
import { z } from "zod";
import { logEvent } from "@/lib/analytics";
import { requireCurrentUser } from "@/lib/auth";
import {
  calculateStreak,
  getTodayHabits,
  HABIT_META,
  HABIT_TYPES,
  toggleHabit,
} from "@/lib/habits";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const [todayHabits, streak] = await Promise.all([
      getTodayHabits(user.id),
      calculateStreak(user.id),
    ]);

    const completed = todayHabits.map((h) => h.type);

    return jsonOk({
      habits: HABIT_TYPES.map((type) => ({
        type,
        ...HABIT_META[type],
        completed: completed.includes(type),
      })),
      completedCount: completed.length,
      totalCount: HABIT_TYPES.length,
      streak,
      tier: user.tier,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const toggleSchema = z.object({
  type: z.nativeEnum(HabitType),
});

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = toggleSchema.parse(await request.json());
    const result = await toggleHabit(user.id, body.type);
    const streak = await calculateStreak(user.id);

    if (result.completed) {
      void logEvent("habit_complete", {
        userId: user.id,
        metadata: { type: body.type },
      });
    }

    return jsonOk({ ...result, streak });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireCurrentUser();
    const { prisma } = await import("@/lib/prisma");
    const { startOfDay } = await import("@/lib/habits");

    await prisma.habit.deleteMany({
      where: { userId: user.id, date: startOfDay() },
    });

    return jsonOk({ reset: true });
  } catch (error) {
    return handleApiError(error);
  }
}
