import type { User } from "@prisma/client";
import { prisma } from "./prisma";

export class PartnerInviteError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function acceptPartnerInvite(user: User, inviteCode: string) {
  if (inviteCode === user.inviteCode) {
    throw new PartnerInviteError("You cannot partner with yourself", 400);
  }

  const partner = await prisma.user.findUnique({
    where: { inviteCode },
  });

  if (!partner) {
    throw new PartnerInviteError("Invalid invite code", 404);
  }

  const existingCount = await prisma.partnership.count({
    where: { userId: user.id },
  });

  const maxPartners = user.tier === "PREMIUM" ? 999 : 1;
  if (existingCount >= maxPartners) {
    throw new PartnerInviteError(
      "Partner limit reached. Upgrade to Premium for unlimited partners.",
      403,
    );
  }

  const alreadyLinked = await prisma.partnership.findUnique({
    where: {
      userId_partnerId: { userId: user.id, partnerId: partner.id },
    },
  });

  if (alreadyLinked) {
    return {
      partner: {
        id: partner.id,
        name: partner.name ?? partner.email.split("@")[0],
      },
      alreadyLinked: true,
    };
  }

  await prisma.$transaction([
    prisma.partnership.create({
      data: { userId: user.id, partnerId: partner.id },
    }),
    prisma.partnership.create({
      data: { userId: partner.id, partnerId: user.id },
    }),
  ]);

  return {
    partner: {
      id: partner.id,
      name: partner.name ?? partner.email.split("@")[0],
    },
    alreadyLinked: false,
  };
}
