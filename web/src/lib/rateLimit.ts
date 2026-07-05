import { prisma } from "./prisma";

export class RateLimitError extends Error {
  status = 429;

  constructor(message = "Too many requests. Please try again later.") {
    super(message);
  }
}

export async function assertCoachRateLimit(userId: string, maxPerHour = 30) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.chatMessage.count({
    where: {
      userId,
      role: "user",
      createdAt: { gte: since },
    },
  });

  if (count >= maxPerHour) {
    throw new RateLimitError(
      "You've reached the hourly coach limit. Please try again in a little while.",
    );
  }
}
