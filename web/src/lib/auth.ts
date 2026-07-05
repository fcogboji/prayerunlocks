import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import type { User } from "@prisma/client";

export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function requireAuthUserId(): Promise<string> {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function syncUserFromClerk(): Promise<User> {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("Unauthorized");
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("User email required");
  }

  return prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email,
      name: clerkUser.fullName ?? clerkUser.firstName ?? null,
      imageUrl: clerkUser.imageUrl ?? null,
    },
    create: {
      clerkId: clerkUser.id,
      email,
      name: clerkUser.fullName ?? clerkUser.firstName ?? null,
      imageUrl: clerkUser.imageUrl ?? null,
    },
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  return prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });
}

export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    return syncUserFromClerk();
  }
  return user;
}

export function isPremium(user: User): boolean {
  return user.tier === "PREMIUM";
}
