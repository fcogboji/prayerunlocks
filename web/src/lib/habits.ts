import { HabitType } from "@prisma/client";
import { prisma } from "./prisma";

export const HABIT_TYPES: HabitType[] = [
  "PRAYER",
  "BIBLE",
  "DEVOTIONAL",
  "FASTING",
  "ENCOURAGE",
];

export const HABIT_META: Record<
  HabitType,
  { title: string; description: string; action: string; badge: string }
> = {
  BIBLE: {
    badge: "1",
    title: "Read Scripture",
    description: "Spend 10 focused minutes in today's passage.",
    action: "Mark read",
  },
  PRAYER: {
    badge: "2",
    title: "Pray",
    description: "Name one worry and hand it to God honestly.",
    action: "Mark prayed",
  },
  DEVOTIONAL: {
    badge: "3",
    title: "Reflect",
    description: "Write one sentence about what stood out.",
    action: "Mark reflected",
  },
  FASTING: {
    badge: "4",
    title: "Fast",
    description: "Honor your fast — food, social media, or a chosen sacrifice.",
    action: "Mark fast kept",
  },
  ENCOURAGE: {
    badge: "5",
    title: "Encourage",
    description: "Send a short prayer or verse to someone.",
    action: "Mark sent",
  },
};

export function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function dateKey(date = new Date()): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

export async function getTodayHabits(userId: string, date = new Date()) {
  const day = startOfDay(date);
  const habits = await prisma.habit.findMany({
    where: { userId, date: day },
  });
  return habits;
}

export async function toggleHabit(
  userId: string,
  type: HabitType,
  date = new Date(),
) {
  const day = startOfDay(date);
  const existing = await prisma.habit.findUnique({
    where: {
      userId_type_date: { userId, type, date: day },
    },
  });

  if (existing) {
    await prisma.habit.delete({ where: { id: existing.id } });
    return { completed: false, type };
  }

  await prisma.habit.create({
    data: { userId, type, date: day, completed: true },
  });
  return { completed: true, type };
}

export async function calculateStreak(userId: string): Promise<number> {
  const habits = await prisma.habit.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  const byDate = new Map<string, Set<HabitType>>();
  for (const habit of habits) {
    const key = habit.date.toISOString().slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, new Set());
    byDate.get(key)!.add(habit.type);
  }

  let streak = 0;
  const today = startOfDay();
  let cursor = new Date(today);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    const completed = byDate.get(key);
    if (!completed || completed.size < HABIT_TYPES.length) {
      if (streak === 0 && key === dateKey(today)) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        continue;
      }
      break;
    }
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

export async function getWeeklyStats(userId: string) {
  const end = startOfDay();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);

  const habits = await prisma.habit.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
    },
  });

  const nudges = await prisma.nudge.count({
    where: {
      fromUserId: userId,
      createdAt: { gte: start },
    },
  });

  const byDate = new Map<string, HabitType[]>();
  for (const habit of habits) {
    const key = habit.date.toISOString().slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(habit.type);
  }

  const days: { date: string; completed: HabitType[] }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, completed: byDate.get(key) ?? [] });
  }

  const totalPossible = 7 * HABIT_TYPES.length;
  const totalDone = habits.length;
  const prayerDays = days.filter((d) => d.completed.includes("PRAYER")).length;

  return {
    days,
    weeklyConsistency: Math.round((totalDone / totalPossible) * 100),
    prayerDays,
    nudgesSent: nudges,
  };
}
