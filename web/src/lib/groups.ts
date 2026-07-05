import type { HabitType, NudgeType, User } from "@prisma/client";
import { prisma } from "./prisma";
import {
  calculateStreak,
  dateKey,
  getWeeklyStats,
  HABIT_TYPES,
  startOfDay,
} from "./habits";
import { notifyUser } from "./push";

export class GroupError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function createChurchGroup(
  user: User,
  name: string,
  churchName?: string,
) {
  const existingLead = await prisma.churchGroup.count({
    where: { leaderId: user.id },
  });

  const maxGroups = user.tier === "PREMIUM" ? 10 : 1;
  if (existingLead >= maxGroups) {
    throw new GroupError(
      "Group limit reached. Upgrade to Premium to lead more groups.",
      403,
    );
  }

  const group = await prisma.churchGroup.create({
    data: {
      name,
      churchName,
      leaderId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "LEADER",
        },
      },
    },
  });

  return group;
}

export async function joinChurchGroup(user: User, inviteCode: string) {
  const group = await prisma.churchGroup.findUnique({
    where: { inviteCode },
  });

  if (!group) {
    throw new GroupError("Invalid group code", 404);
  }

  const existing = await prisma.churchMembership.findUnique({
    where: {
      userId_groupId: { userId: user.id, groupId: group.id },
    },
  });

  if (existing) {
    return { group, alreadyMember: true };
  }

  const membershipCount = await prisma.churchMembership.count({
    where: { userId: user.id },
  });
  const maxMemberships = user.tier === "PREMIUM" ? 10 : 1;
  if (membershipCount >= maxMemberships) {
    throw new GroupError(
      "Group limit reached. Free plan includes 1 church group. Upgrade to Premium for more.",
      403,
    );
  }

  await prisma.churchMembership.create({
    data: {
      userId: user.id,
      groupId: group.id,
      role: "MEMBER",
    },
  });

  return { group, alreadyMember: false };
}

export async function getUserGroups(userId: string) {
  const memberships = await prisma.churchMembership.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          leader: { select: { name: true, email: true } },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://prayerunlocks.com";

  return memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    churchName: m.group.churchName,
    inviteCode: m.group.inviteCode,
    role: m.role,
    memberCount: m.group._count.members,
    leaderName:
      m.group.leader.name ?? m.group.leader.email.split("@")[0],
    inviteUrl: `${baseUrl}/join/group/${m.group.inviteCode}`,
  }));
}

export async function getGroupDetails(groupId: string, userId: string) {
  const membership = await prisma.churchMembership.findUnique({
    where: {
      userId_groupId: { userId, groupId },
    },
  });

  if (!membership) {
    throw new GroupError("Not a member of this group", 403);
  }

  const group = await prisma.churchGroup.findUnique({
    where: { id: groupId },
    include: {
      leader: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!group) {
    throw new GroupError("Group not found", 404);
  }

  const today = startOfDay();
  const weekStart = new Date(today);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  const memberIds = group.members.map((m) => m.userId);

  const weekHabits = await prisma.habit.findMany({
    where: {
      userId: { in: memberIds },
      date: { gte: weekStart, lte: today },
    },
  });

  const todayKey = dateKey(today);
  const habitsByUserDate = new Map<string, Map<string, Set<HabitType>>>();

  for (const habit of weekHabits) {
    const userKey = habit.userId;
    const dayKey = habit.date.toISOString().slice(0, 10);
    if (!habitsByUserDate.has(userKey)) {
      habitsByUserDate.set(userKey, new Map());
    }
    const userDays = habitsByUserDate.get(userKey)!;
    if (!userDays.has(dayKey)) userDays.set(dayKey, new Set());
    userDays.get(dayKey)!.add(habit.type);
  }

  const members = await Promise.all(
    group.members.map(async (m) => {
      const displayName = m.user.name ?? m.user.email.split("@")[0];
      const userDays = habitsByUserDate.get(m.user.id);
      const todayHabits = [...(userDays?.get(todayKey) ?? [])];
      const streak = await calculateStreak(m.user.id);
      const weekly = await getWeeklyStats(m.user.id);

      return {
        id: m.user.id,
        name: displayName,
        role: m.role,
        todayCompleted: todayHabits.length,
        totalHabits: HABIT_TYPES.length,
        completedToday: todayHabits,
        streak,
        weeklyConsistency: weekly.weeklyConsistency,
        prayerDays: weekly.prayerDays,
        needsAttention: todayHabits.length === 0,
      };
    }),
  );

  const weekOverview: { date: string; activeMembers: number }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = dateKey(d);
    let active = 0;
    for (const memberId of memberIds) {
      const count = habitsByUserDate.get(memberId)?.get(key)?.size ?? 0;
      if (count > 0) active += 1;
    }
    weekOverview.push({ date: key, activeMembers: active });
  }

  const activeToday = members.filter((m) => m.todayCompleted > 0).length;
  const fullyCompleteToday = members.filter(
    (m) => m.todayCompleted >= HABIT_TYPES.length,
  ).length;
  const needsAttention = members.filter((m) => m.needsAttention).length;
  const avgWeeklyConsistency =
    members.length > 0
      ? Math.round(
          members.reduce((sum, m) => sum + m.weeklyConsistency, 0) /
            members.length,
        )
      : 0;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://prayerunlocks.com";

  return {
    id: group.id,
    name: group.name,
    churchName: group.churchName,
    inviteCode: group.inviteCode,
    inviteUrl: `${baseUrl}/join/group/${group.inviteCode}`,
    role: membership.role,
    isLeader: membership.role === "LEADER",
    leaderName:
      group.leader.name ?? group.leader.email.split("@")[0],
    summary: {
      memberCount: members.length,
      activeToday,
      fullyCompleteToday,
      needsAttention,
      avgWeeklyConsistency,
    },
    weekOverview,
    members: members.sort((a, b) => {
      if (a.needsAttention !== b.needsAttention) {
        return a.needsAttention ? -1 : 1;
      }
      return b.todayCompleted - a.todayCompleted;
    }),
  };
}

export async function nudgeGroupMember(
  groupId: string,
  leaderId: string,
  memberId: string,
  type: NudgeType = "ENCOURAGEMENT",
  message?: string,
) {
  if (leaderId === memberId) {
    throw new GroupError("Cannot nudge yourself", 400);
  }

  const membership = await prisma.churchMembership.findUnique({
    where: {
      userId_groupId: { userId: leaderId, groupId },
    },
  });

  if (!membership || membership.role !== "LEADER") {
    throw new GroupError("Only group leaders can send encouragement", 403);
  }

  const target = await prisma.churchMembership.findUnique({
    where: {
      userId_groupId: { userId: memberId, groupId },
    },
  });

  if (!target) {
    throw new GroupError("Member not in this group", 404);
  }

  const leader = await prisma.user.findUniqueOrThrow({
    where: { id: leaderId },
  });

  const nudge = await prisma.nudge.create({
    data: {
      fromUserId: leaderId,
      toUserId: memberId,
      type,
      message: message ?? "Your leader is cheering you on today 🙏",
    },
  });

  const senderName = leader.name ?? leader.email.split("@")[0];
  await notifyUser(
    memberId,
    `${senderName} sent encouragement`,
    nudge.message ?? "Open PrayerUnlocks to see their message",
    { type: "nudge", nudgeId: nudge.id },
  );

  return nudge;
}
