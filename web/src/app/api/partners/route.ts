import { z } from "zod";
import { NudgeType } from "@prisma/client";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { startOfDay } from "@/lib/habits";
import { acceptPartnerInvite, PartnerInviteError } from "@/lib/partners";
import { notifyUser } from "@/lib/push";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const partnerships = await prisma.partnership.findMany({
      where: { userId: user.id },
      include: {
        partner: {
          include: {
            habits: {
              where: { date: startOfDay() },
            },
          },
        },
      },
    });

    const partners = partnerships.map((p) => ({
      id: p.partner.id,
      name: p.partner.name ?? p.partner.email.split("@")[0],
      imageUrl: p.partner.imageUrl,
      todayCompleted: p.partner.habits.length,
    }));

    const unreadNudges = await prisma.nudge.findMany({
      where: { toUserId: user.id, read: false },
      include: {
        fromUser: { select: { name: true, email: true, id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const partnerIds = partnerships.map((p) => p.partner.id);
    const recentNudges = await prisma.nudge.findMany({
      where: {
        OR: [
          { fromUserId: { in: partnerIds }, toUserId: user.id },
          { fromUserId: user.id, toUserId: { in: partnerIds } },
        ],
      },
      include: {
        fromUser: { select: { name: true, email: true } },
        toUser: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    const activity = [
      ...partnerships
        .filter((p) => p.partner.habits.length > 0)
        .map((p) => ({
          id: `habits-${p.partner.id}`,
          type: "habits" as const,
          name: p.partner.name ?? p.partner.email.split("@")[0],
          message: `Completed ${p.partner.habits.length}/5 habits today`,
          createdAt: new Date().toISOString(),
        })),
      ...recentNudges.map((n) => ({
        id: n.id,
        type: "nudge" as const,
        name:
          n.fromUserId === user.id
            ? `You → ${n.toUser.name ?? n.toUser.email.split("@")[0]}`
            : (n.fromUser.name ?? n.fromUser.email.split("@")[0]),
        message: n.message ?? "Sent encouragement",
        createdAt: n.createdAt.toISOString(),
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10);

    return jsonOk({
      partners,
      partnerCount: partners.length,
      maxPartners: user.tier === "PREMIUM" ? 999 : 1,
      tier: user.tier,
      inviteCode: user.inviteCode,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/join/${user.inviteCode}`,
      unreadNudges,
      activity,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const inviteSchema = z.object({
  inviteCode: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { inviteCode } = inviteSchema.parse(await request.json());
    const result = await acceptPartnerInvite(user, inviteCode);
    return jsonOk(result);
  } catch (error) {
    if (error instanceof PartnerInviteError) {
      return jsonError(error.message, error.status);
    }
    return handleApiError(error);
  }
}

const nudgeSchema = z.object({
  partnerId: z.string(),
  type: z.nativeEnum(NudgeType).optional(),
  message: z.string().optional(),
});

export async function PUT(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { partnerId, type, message } = nudgeSchema.parse(await request.json());

    const linked = await prisma.partnership.findUnique({
      where: { userId_partnerId: { userId: user.id, partnerId } },
    });

    if (!linked) {
      return jsonError("Not partnered with this user", 403);
    }

    const nudge = await prisma.nudge.create({
      data: {
        fromUserId: user.id,
        toUserId: partnerId,
        type: type ?? "ENCOURAGEMENT",
        message: message ?? "Have you prayed today? 🙏",
      },
    });

    const senderName = user.name ?? user.email.split("@")[0];
    await notifyUser(
      partnerId,
      `${senderName} sent encouragement`,
      nudge.message ?? "Open Steadfast to see their message",
      { type: "nudge", nudgeId: nudge.id },
    );

    return jsonOk({ nudge });
  } catch (error) {
    return handleApiError(error);
  }
}

const readNudgeSchema = z.object({
  nudgeId: z.string().optional(),
  markAll: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { nudgeId, markAll } = readNudgeSchema.parse(await request.json());

    if (markAll) {
      await prisma.nudge.updateMany({
        where: { toUserId: user.id, read: false },
        data: { read: true },
      });
      return jsonOk({ markedAll: true });
    }

    if (!nudgeId) {
      return jsonError("nudgeId or markAll required", 400);
    }

    const nudge = await prisma.nudge.findFirst({
      where: { id: nudgeId, toUserId: user.id },
    });

    if (!nudge) {
      return jsonError("Nudge not found", 404);
    }

    await prisma.nudge.update({
      where: { id: nudgeId },
      data: { read: true },
    });

    return jsonOk({ read: true });
  } catch (error) {
    return handleApiError(error);
  }
}
