import type { User } from "@prisma/client";
import { requireCurrentUser } from "./auth";
import { prisma } from "./prisma";
import { PREMIUM_PRICE_USD } from "./stripe";

export class AdminError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin(): Promise<User> {
  const user = await requireCurrentUser();
  const admins = getAdminEmails();

  if (admins.length === 0) {
    throw new AdminError(
      "Admin access not configured. Set ADMIN_EMAILS in web/.env.local",
      503,
    );
  }

  if (!admins.includes(user.email.toLowerCase())) {
    throw new AdminError("Forbidden", 403);
  }

  return user;
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase());
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getAdminOverview() {
  const now = new Date();
  const today = daysAgo(0);
  const weekAgo = daysAgo(7);
  const monthAgo = daysAgo(30);

  const [
    totalUsers,
    premiumUsers,
    newUsersWeek,
    newUsersMonth,
    waitlistCount,
    unlocksToday,
    unlocksWeek,
    pageViewsWeek,
    habitsWeek,
    coachWeek,
    nudgesWeek,
    groupsCount,
    recentSignups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { tier: "PREMIUM" } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.waitlistEntry.count(),
    prisma.unlockRequest.count({ where: { createdAt: { gte: today } } }),
    prisma.unlockRequest.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.analyticsEvent.count({
      where: { type: "page_view", createdAt: { gte: weekAgo } },
    }),
    prisma.analyticsEvent.count({
      where: { type: "habit_complete", createdAt: { gte: weekAgo } },
    }),
    prisma.analyticsEvent.count({
      where: { type: "coach", createdAt: { gte: weekAgo } },
    }),
    prisma.nudge.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.churchGroup.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        tier: true,
        createdAt: true,
      },
    }),
  ]);

  const [unlockDates, signupDates, viewDates] = await Promise.all([
    prisma.unlockRequest.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { createdAt: true },
    }),
    prisma.analyticsEvent.findMany({
      where: { type: "page_view", createdAt: { gte: weekAgo } },
      select: { createdAt: true },
    }),
  ]);

  const mrrUsd = (premiumUsers * PREMIUM_PRICE_USD) / 100;
  const arrUsd = mrrUsd * 12;

  const chartDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    return { date: key, label: d.toLocaleDateString("en-GB", { weekday: "short" }) };
  });

  const unlocksByDay = bucketByDay(
    unlockDates.map((r) => r.createdAt),
    chartDays,
  );

  const signupsByDay = bucketByDay(
    signupDates.map((u) => u.createdAt),
    chartDays,
  );

  const viewsByDay = bucketByDay(
    viewDates.map((e) => e.createdAt),
    chartDays,
  );

  return {
    generatedAt: now.toISOString(),
    users: {
      total: totalUsers,
      premium: premiumUsers,
      free: totalUsers - premiumUsers,
      newWeek: newUsersWeek,
      newMonth: newUsersMonth,
      conversionRate:
        totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0,
    },
    revenue: {
      mrrUsd,
      arrUsd,
      premiumPriceUsd: PREMIUM_PRICE_USD / 100,
      currency: "USD",
    },
    engagement: {
      unlocksToday,
      unlocksWeek,
      pageViewsWeek,
      habitsWeek,
      coachMessagesWeek: coachWeek,
      nudgesWeek,
      groupsCount,
      waitlistCount,
    },
    charts: {
      unlocks: unlocksByDay,
      signups: signupsByDay,
      pageViews: viewsByDay,
    },
    recentSignups,
  };
}

function bucketByDay(
  dates: Date[],
  days: { date: string; label: string }[],
): { date: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const d of days) counts.set(d.date, 0);
  for (const dt of dates) {
    const key = dt.toISOString().slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return days.map((d) => ({ ...d, count: counts.get(d.date) ?? 0 }));
}

export async function getAdminUsers(page = 1, limit = 25) {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        tier: true,
        createdAt: true,
        stripeSubscriptionId: true,
        _count: {
          select: {
            habits: true,
            unlockRequests: true,
            chatMessages: true,
            sentNudges: true,
          },
        },
      },
    }),
    prisma.user.count(),
  ]);

  return { users, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getAdminRevenue() {
  const premiumUsers = await prisma.user.findMany({
    where: { tier: "PREMIUM" },
    select: {
      id: true,
      name: true,
      email: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      updatedAt: true,
      createdAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const checkoutEvents = await prisma.analyticsEvent.findMany({
    where: {
      type: { in: ["checkout_started", "subscription_active", "subscription_cancelled"] },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { email: true, name: true } } },
  });

  const mrr = (premiumUsers.length * PREMIUM_PRICE_USD) / 100;

  return {
    mrrUsd: mrr,
    arrUsd: mrr * 12,
    activeSubscriptions: premiumUsers.length,
    subscribers: premiumUsers,
    recentBillingEvents: checkoutEvents.map((e) => ({
      id: e.id,
      type: e.type,
      createdAt: e.createdAt,
      user: e.user,
      metadata: e.metadata ? JSON.parse(e.metadata) : null,
    })),
  };
}

export async function getAdminActivity(limit = 40) {
  const [events, unlocks, nudges] = await Promise.all([
    prisma.analyticsEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.unlockRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.nudge.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        fromUser: { select: { name: true, email: true } },
        toUser: { select: { name: true, email: true } },
      },
    }),
  ]);

  return { events, unlocks, nudges };
}

export async function getAdminUnlockInsights() {
  const recent = await prisma.unlockRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true, email: true } } },
  });

  const weekAgo = daysAgo(7);
  const weekCount = await prisma.unlockRequest.count({
    where: { createdAt: { gte: weekAgo } },
  });

  const prayerTypes = await prisma.unlockRequest.groupBy({
    by: ["prayerType"],
    where: { prayerType: { not: null }, createdAt: { gte: daysAgo(30) } },
    _count: true,
    orderBy: { _count: { prayerType: "desc" } },
    take: 10,
  });

  return { recent, weekCount, prayerTypes };
}

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "been",
  "being",
  "could",
  "does",
  "doing",
  "dont",
  "from",
  "have",
  "having",
  "help",
  "here",
  "into",
  "just",
  "know",
  "like",
  "need",
  "really",
  "that",
  "their",
  "them",
  "there",
  "these",
  "they",
  "this",
  "through",
  "very",
  "want",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
  "your",
]);

function extractTopKeywords(situations: string[], limit = 12) {
  const counts = new Map<string, number>();

  for (const text of situations) {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

    const seen = new Set<string>();
    for (const word of words) {
      if (seen.has(word)) continue;
      seen.add(word);
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

function aggregateVerseReferences(
  rows: { verses: string | null }[],
  limit = 15,
) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (!row.verses) continue;
    try {
      const refs = JSON.parse(row.verses) as string[];
      const seen = new Set<string>();
      for (const ref of refs) {
        const key = ref.trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    } catch {
      /* skip malformed */
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([reference, count]) => ({ reference, count }));
}

export async function getAdminDemandInsights() {
  const monthAgo = daysAgo(30);
  const weekAgo = daysAgo(7);

  const [monthRequests, weekCount, monthCount] = await Promise.all([
    prisma.unlockRequest.findMany({
      where: { createdAt: { gte: monthAgo } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        situation: true,
        prayerType: true,
        verses: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.unlockRequest.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.unlockRequest.count({ where: { createdAt: { gte: monthAgo } } }),
  ]);

  const prayerTypes = new Map<string, number>();
  for (const row of monthRequests) {
    if (!row.prayerType) continue;
    prayerTypes.set(row.prayerType, (prayerTypes.get(row.prayerType) ?? 0) + 1);
  }

  const topPrayerTypes = [...prayerTypes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([prayerType, count]) => ({ prayerType, count }));

  return {
    weekCount,
    monthCount,
    topKeywords: extractTopKeywords(
      monthRequests.map((r) => r.situation),
    ),
    topPrayerTypes,
    topVerses: aggregateVerseReferences(monthRequests),
    recentRequests: monthRequests.slice(0, 40).map((r) => ({
      id: r.id,
      situation: r.situation,
      prayerType: r.prayerType,
      verses: r.verses ? (JSON.parse(r.verses) as string[]) : [],
      createdAt: r.createdAt,
      user: r.user,
    })),
  };
}
