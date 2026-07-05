import { prisma } from "./prisma";

export type EventType =
  | "page_view"
  | "sign_up"
  | "unlock"
  | "coach"
  | "habit_complete"
  | "waitlist"
  | "checkout_started"
  | "subscription_active"
  | "subscription_cancelled";

export async function logEvent(
  type: EventType,
  options?: {
    userId?: string;
    path?: string;
    metadata?: Record<string, string | number | boolean | null>;
  },
) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        type,
        userId: options?.userId,
        path: options?.path,
        metadata: options?.metadata ? JSON.stringify(options.metadata) : null,
      },
    });
  } catch {
    /* analytics must not break core flows */
  }
}
