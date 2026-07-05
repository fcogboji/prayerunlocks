import { useAuth, useUser } from "../../lib/auth";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CircularProgress } from "../../components/CircularProgress";
import {
  createApiClient,
  openBillingPortal,
  type HabitsResponse,
  type WeeklyInsights,
} from "../../lib/api";
import { allowDemoData } from "../../lib/dev";
import { useSubscription } from "../../lib/subscription";
import { colors, radius, spacing } from "../../lib/theme";

type Task = { name: string; time: string; done?: boolean };

type Section = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  tasks: Task[];
  defaultOpen?: boolean;
};


function AccordionCard({ section }: { section: Section }) {
  const [open, setOpen] = useState(section.defaultOpen ?? false);

  return (
    <View style={styles.taskCard}>
      <Pressable style={styles.taskHeader} onPress={() => setOpen((v) => !v)}>
        <View style={[styles.taskIcon, { backgroundColor: section.iconBg }]}>
          <Ionicons name={section.icon} size={18} color={section.iconColor} />
        </View>
        <Text style={styles.taskCategory}>{section.title}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
      </Pressable>

      {open && (
        <>
          {section.tasks.map((task) => (
            <View key={task.name} style={styles.taskItem}>
              <View style={[styles.radio, task.done && styles.radioDone]}>
                {task.done && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.taskName}>{task.name}</Text>
                <Text style={styles.taskTime}>{task.time}</Text>
              </View>
            </View>
          ))}
          <Pressable style={styles.collectionLink}>
            <Text style={styles.collectionText}>Go to Collection</Text>
            <Ionicons name="chevron-down" size={14} color={colors.pink} />
          </Pressable>
        </>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { isPremium, refresh } = useSubscription();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"overview" | "stats">("overview");
  const [habits, setHabits] = useState<HabitsResponse | null>(null);
  const [insights, setInsights] = useState<WeeklyInsights | null>(null);

  const load = useCallback(async () => {
    try {
      const api = createApiClient(getToken);
      const [habitsRes, insightsRes] = await Promise.all([
        api.get<HabitsResponse>("/api/habits"),
        api.get<WeeklyInsights>("/api/insights"),
      ]);
      setHabits(habitsRes.data);
      setInsights(insightsRes.data);
    } catch {
      if (!allowDemoData) return;
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  const sections = useMemo((): Section[] => {
    const list = habits?.habits ?? [];
    const faith = list.filter((h) => ["PRAYER", "BIBLE", "DEVOTIONAL"].includes(h.type));
    const personal = list.filter((h) => h.type === "FASTING");
    const community = list.filter((h) => h.type === "ENCOURAGE");

    return [
      {
        id: "faith",
        title: "Faith",
        icon: "sparkles-outline",
        iconColor: colors.pink,
        iconBg: colors.pinkMuted,
        defaultOpen: true,
        tasks: faith.map((h) => ({
          name: h.title,
          time: h.completed ? "Done today" : "Today",
          done: h.completed,
        })),
      },
      {
        id: "personal",
        title: "Discipline",
        icon: "leaf-outline",
        iconColor: "#2dd4bf",
        iconBg: "rgba(45,212,191,0.15)",
        tasks: personal.map((h) => ({
          name: h.title,
          time: h.completed ? "Done today" : "Today",
          done: h.completed,
        })),
      },
      {
        id: "community",
        title: "Community",
        icon: "people-outline",
        iconColor: colors.purple,
        iconBg: colors.purpleMuted,
        tasks: community.map((h) => ({
          name: h.title,
          time: h.completed ? "Done today" : "Today",
          done: h.completed,
        })),
      },
    ].filter((s) => s.tasks.length > 0);
  }, [habits]);

  const goalPercent = habits
    ? Math.round((habits.completedCount / habits.totalCount) * 100)
    : 0;
  const barData =
    insights?.days.map((d) => d.completed.length / 5) ?? [0.35, 0.55, 0.45, 0.85, 0.5, 0.75, 0.6];

  const name = user?.fullName ?? user?.firstName ?? "Friend";
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={styles.dashboardLabel}>Dashboard</Text>
          <View style={styles.topActions}>
            <Pressable
              style={styles.signOutBtn}
              onPress={async () => {
                await signOut();
                router.replace("/(auth)/sign-in");
              }}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.muted} />
            </Pressable>
            <Image
              source={{
                uri: user?.imageUrl ?? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
              }}
              style={styles.profilePic}
              contentFit="cover"
            />
          </View>
        </View>

        <Text style={styles.greeting}>
          {greeting},{"\n"}
          {name}
        </Text>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === "overview" && styles.tabActive]}
            onPress={() => setTab("overview")}
          >
            <Text style={[styles.tabText, tab === "overview" && styles.tabTextActive]}>
              Daily Overview
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === "stats" && styles.tabActive]}
            onPress={() => setTab("stats")}
          >
            <Text style={[styles.tabText, tab === "stats" && styles.tabTextActive]}>
              Statistics
            </Text>
          </Pressable>
        </View>

        {tab === "overview" ? (
          sections.map((section) => <AccordionCard key={section.id} section={section} />)
        ) : (
          <>
            {!isPremium ? (
              <Pressable
                style={styles.upgradeCard}
                onPress={() => router.push("/paywall")}
              >
                <LinearGradient
                  colors={[colors.gradientPink, colors.gradientPurple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="sparkles" size={22} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.upgradeTitle}>Go Premium</Text>
                  <Text style={styles.upgradeSub}>AI coach + unlimited partners</Text>
                </View>
                <Text style={styles.upgradePrice}>$4.99/mo</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.manageCard}
                onPress={() => openBillingPortal(getToken, refresh)}
              >
                <Ionicons name="card-outline" size={20} color={colors.lime} />
                <Text style={styles.manageText}>Manage subscription</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            )}

            <View style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={[styles.taskIcon, { backgroundColor: colors.pinkMuted }]}>
                  <Ionicons name="trophy-outline" size={18} color={colors.pink} />
                </View>
                <Text style={styles.taskCategory}>Weekly Goal</Text>
                <Text style={styles.moreLink}>More</Text>
              </View>
              <View style={styles.goalBody}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalLabel}>Goal Progress</Text>
                  <Text style={styles.goalValue}>
                    {habits?.completedCount ?? 0}/{habits?.totalCount ?? 5} habits today
                  </Text>
                  <View style={styles.goalActions}>
                    <Pressable style={styles.secondaryBtn}>
                      <Text style={styles.secondaryBtnText}>Show Completed</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryBtn}>
                      <Text style={styles.secondaryBtnText}>Edit Goal</Text>
                    </Pressable>
                  </View>
                </View>
                <CircularProgress progress={goalPercent} size={72} strokeWidth={5} color={colors.pink} />
              </View>
            </View>

            <View style={styles.statsCard}>
              <View style={styles.goalHeader}>
                <View style={[styles.taskIcon, { backgroundColor: colors.purpleMuted }]}>
                  <Ionicons name="bar-chart-outline" size={18} color={colors.purple} />
                </View>
                <Text style={styles.taskCategory}>Statistics</Text>
                <View style={styles.dropdown}>
                  <Text style={styles.dropdownText}>Last 7 Days</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.muted} />
                </View>
              </View>
              <View style={styles.barChart}>
                {barData.map((h, i) => (
                  <View key={i} style={styles.barCol}>
                    <LinearGradient
                      colors={[colors.gradientPink, colors.gradientPurple]}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0 }}
                      style={[styles.bar, { height: h * 80 + 20 }]}
                    />
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dashboardBg },
  content: { padding: spacing.lg, paddingBottom: 120 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  dashboardLabel: { color: colors.muted, fontSize: 14, fontWeight: "500" },
  topActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  signOutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dashboardCard,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.pinkMuted,
  },
  greeting: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
    marginBottom: spacing.lg,
  },
  tabs: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.dashboardCard,
  },
  tabActive: {
    borderColor: colors.pink,
    backgroundColor: "rgba(255,78,173,0.08)",
  },
  tabText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: colors.ink },
  taskCard: {
    backgroundColor: colors.dashboardCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  taskHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  taskIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  taskCategory: { flex: 1, color: colors.ink, fontWeight: "700", fontSize: 16 },
  taskItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.mutedDark,
  },
  radioDone: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  taskName: { color: colors.ink, fontWeight: "600", fontSize: 14 },
  taskTime: { color: colors.muted, fontSize: 12, marginTop: 2 },
  collectionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.xs,
  },
  collectionText: { color: colors.pink, fontSize: 13, fontWeight: "600" },
  goalCard: {
    backgroundColor: colors.dashboardCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  goalHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  moreLink: { color: colors.muted, fontSize: 13 },
  goalBody: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  goalLabel: { color: colors.muted, fontSize: 13 },
  goalValue: { color: colors.ink, fontSize: 18, fontWeight: "800", marginTop: 4, marginBottom: spacing.md },
  goalActions: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  secondaryBtn: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  secondaryBtnText: { color: colors.ink, fontSize: 11, fontWeight: "600" },
  statsCard: {
    backgroundColor: colors.dashboardCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  dropdown: { flexDirection: "row", alignItems: "center", gap: 4 },
  dropdownText: { color: colors.muted, fontSize: 12 },
  barChart: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 100,
    paddingHorizontal: spacing.sm,
    gap: 6,
  },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: { width: "100%", maxWidth: 28, borderRadius: 8 },
  upgradeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  upgradeTitle: { color: "#fff", fontWeight: "800", fontSize: 16 },
  upgradeSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
  upgradePrice: { color: "#fff", fontWeight: "800", fontSize: 14 },
  manageCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  manageText: { flex: 1, color: colors.ink, fontWeight: "700", fontSize: 14 },
});
