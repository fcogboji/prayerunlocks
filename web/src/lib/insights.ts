import type { User } from "@prisma/client";
import { getWeeklyStats } from "./habits";
import { isPremium } from "./auth";

export async function getInsightsForUser(user: User) {
  const stats = await getWeeklyStats(user.id);

  if (!isPremium(user)) {
    return {
      weeklyConsistency: stats.weeklyConsistency,
      prayerDays: stats.prayerDays,
      nudgesSent: 0,
      days: [] as { date: string; completed: string[] }[],
      tier: user.tier,
      advancedLocked: true,
    };
  }

  return {
    ...stats,
    tier: user.tier,
    advancedLocked: false,
  };
}
