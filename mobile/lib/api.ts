import axios, { type AxiosInstance } from "axios";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  "http://localhost:3000";

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  tier: "FREE" | "PREMIUM";
  inviteCode: string;
};

export function createApiClient(getToken: () => Promise<string | null>): AxiosInstance {
  const client = axios.create({
    baseURL: API_URL,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        unauthorizedHandler?.();
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export async function fetchUserProfile(
  api: AxiosInstance,
): Promise<UserProfile> {
  const res = await api.get<UserProfile>("/api/user");
  return res.data;
}

export type Habit = {
  type: string;
  title: string;
  description: string;
  action: string;
  badge: string;
  completed: boolean;
};

export type HabitsResponse = {
  habits: Habit[];
  completedCount: number;
  totalCount: number;
  streak: number;
  tier: "FREE" | "PREMIUM" | string;
};

export type Partner = {
  id: string;
  name: string;
  todayCompleted: number;
  imageUrl?: string | null;
};

export type Nudge = {
  id: string;
  type: string;
  message: string | null;
  createdAt: string;
  fromUser: { name: string | null; email: string; id?: string };
};

export type ActivityItem = {
  id: string;
  type: "habits" | "nudge";
  name: string;
  message: string;
  createdAt: string;
};

export type PartnersResponse = {
  partners: Partner[];
  partnerCount: number;
  maxPartners: number;
  tier: "FREE" | "PREMIUM";
  inviteCode: string;
  inviteUrl: string;
  unreadNudges: Nudge[];
  activity: ActivityItem[];
};

export type PrayerUnlock = {
  encouragement: string;
  verses: { reference: string; text: string; why: string }[];
  prayerType: string;
  prayerTypeExplain: string;
  howToPray: string[];
  samplePrayer: string;
  consistencyTip: string;
};

export type PrayerUnlockResponse = {
  unlock: PrayerUnlock;
  situation: string;
};

export type WeeklyInsights = {
  days: { date: string; completed: string[] }[];
  weeklyConsistency: number;
  prayerDays: number;
  nudgesSent: number;
  tier?: "FREE" | "PREMIUM" | string;
  advancedLocked?: boolean;
};

export type ChurchGroup = {
  id: string;
  name: string;
  churchName?: string | null;
  inviteCode: string;
  role: "LEADER" | "MEMBER";
  memberCount: number;
  leaderName: string;
  inviteUrl?: string;
};

export type GroupMember = {
  id: string;
  name: string;
  role: "LEADER" | "MEMBER";
  todayCompleted: number;
  totalHabits: number;
  completedToday: string[];
  streak: number;
  weeklyConsistency: number;
  prayerDays: number;
  needsAttention: boolean;
};

export type GroupDashboard = {
  id: string;
  name: string;
  churchName?: string | null;
  inviteCode: string;
  inviteUrl: string;
  role: "LEADER" | "MEMBER";
  isLeader: boolean;
  leaderName: string;
  summary: {
    memberCount: number;
    activeToday: number;
    fullyCompleteToday: number;
    needsAttention: number;
    avgWeeklyConsistency: number;
  };
  weekOverview: { date: string; activeMembers: number }[];
  members: GroupMember[];
};

export type ChatMessage = {
  role: string;
  content: string;
};

const HABIT_ICONS: Record<string, keyof typeof import("@expo/vector-icons").Ionicons.glyphMap> = {
  PRAYER: "hand-left-outline",
  BIBLE: "book-outline",
  DEVOTIONAL: "sunny-outline",
  FASTING: "leaf-outline",
  ENCOURAGE: "heart-outline",
};

export function habitIcon(type: string) {
  return HABIT_ICONS[type] ?? "ellipse-outline";
}

export async function openPremiumCheckout(
  getToken: () => Promise<string | null>,
  onReturn?: () => void,
) {
  const api = createApiClient(getToken);
  const res = await api.post<{ url: string }>("/api/stripe/checkout", {});
  if (res.data.url) {
    await WebBrowser.openBrowserAsync(res.data.url);
    onReturn?.();
  }
}

export async function openBillingPortal(
  getToken: () => Promise<string | null>,
  onReturn?: () => void,
) {
  const api = createApiClient(getToken);
  const res = await api.post<{ url: string }>("/api/stripe/checkout", {
    action: "portal",
  });
  if (res.data.url) {
    await WebBrowser.openBrowserAsync(res.data.url);
    onReturn?.();
  }
}
