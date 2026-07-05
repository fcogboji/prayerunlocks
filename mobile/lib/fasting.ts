import { deleteStoredItem, getStoredItem, setStoredItem } from "./storage";

const STORAGE_KEY = "steadfast_fast_session";

export type FastPlan = {
  id: string;
  label: string;
  hours: number;
  description: string;
};

export const FAST_PLANS: FastPlan[] = [
  { id: "16:8", label: "16:8", hours: 16, description: "16h fast · 8h eating window" },
  { id: "14:10", label: "14:10", hours: 14, description: "14h fast · 10h eating window" },
  { id: "18:6", label: "18:6", hours: 18, description: "18h fast · 6h eating window" },
  { id: "24", label: "24h", hours: 24, description: "Full day fast" },
];

export type FastSession = {
  active: boolean;
  startedAt: number;
  planId: string;
  planLabel: string;
  planHours: number;
};

export function getDefaultPlan(): FastPlan {
  return FAST_PLANS[0];
}

export function getFastEndTime(session: FastSession): number {
  return session.startedAt + session.planHours * 60 * 60 * 1000;
}

export function getFastProgress(session: FastSession, now = Date.now()): number {
  const total = session.planHours * 60 * 60 * 1000;
  const elapsed = now - session.startedAt;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export function getFastRemainingMs(session: FastSession, now = Date.now()): number {
  return Math.max(0, getFastEndTime(session) - now);
}

export function isFastComplete(session: FastSession, now = Date.now()): boolean {
  return getFastRemainingMs(session, now) <= 0;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDurationShort(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function formatDateTime(ts: number): string {
  const date = new Date(ts);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  const day = isToday ? "Today" : isTomorrow ? "Tomorrow" : date.toLocaleDateString("en-GB", { weekday: "short" });
  const time = date.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
  return `${day}, ${time}`;
}

export async function loadFastSession(): Promise<FastSession | null> {
  try {
    const raw = await getStoredItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as FastSession;
    if (!session.active) return null;
    return session;
  } catch {
    return null;
  }
}

export async function saveFastSession(session: FastSession | null): Promise<void> {
  if (!session) {
    await deleteStoredItem(STORAGE_KEY);
    return;
  }
  await setStoredItem(STORAGE_KEY, JSON.stringify(session));
}

export async function startFast(plan: FastPlan): Promise<FastSession> {
  const session: FastSession = {
    active: true,
    startedAt: Date.now(),
    planId: plan.id,
    planLabel: plan.label,
    planHours: plan.hours,
  };
  await saveFastSession(session);
  return session;
}

export async function endFast(): Promise<void> {
  await saveFastSession(null);
}
