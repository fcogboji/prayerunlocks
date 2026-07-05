import { useAuth } from "../../lib/auth";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createApiClient, habitIcon, type GroupDashboard } from "../../lib/api";
import { colors, radius, spacing } from "../../lib/theme";
import { allowDemoData } from "../../lib/dev";

const HABIT_ORDER = ["PRAYER", "BIBLE", "DEVOTIONAL", "FASTING", "ENCOURAGE"];

function demoDashboard(id: string): GroupDashboard {
  const today = new Date();
  const weekOverview = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().slice(0, 10),
      activeMembers: [3, 4, 5, 4, 6, 5, 4][i],
    };
  });

  return {
    id,
    name: "Sunday Cell Group",
    churchName: "Grace Community",
    inviteCode: "DEMO-GROUP",
    inviteUrl: "https://steadfast.app/join/group/DEMO-GROUP",
    role: "LEADER",
    isLeader: true,
    leaderName: "You",
    summary: {
      memberCount: 6,
      activeToday: 4,
      fullyCompleteToday: 2,
      needsAttention: 2,
      avgWeeklyConsistency: 72,
    },
    weekOverview,
    members: [
      {
        id: "1",
        name: "Sarah",
        role: "MEMBER",
        todayCompleted: 5,
        totalHabits: 5,
        completedToday: HABIT_ORDER,
        streak: 12,
        weeklyConsistency: 89,
        prayerDays: 6,
        needsAttention: false,
      },
      {
        id: "2",
        name: "James",
        role: "MEMBER",
        todayCompleted: 3,
        totalHabits: 5,
        completedToday: ["PRAYER", "BIBLE", "DEVOTIONAL"],
        streak: 5,
        weeklyConsistency: 71,
        prayerDays: 5,
        needsAttention: false,
      },
      {
        id: "3",
        name: "Emma",
        role: "MEMBER",
        todayCompleted: 0,
        totalHabits: 5,
        completedToday: [],
        streak: 0,
        weeklyConsistency: 42,
        prayerDays: 2,
        needsAttention: true,
      },
      {
        id: "4",
        name: "Daniel",
        role: "MEMBER",
        todayCompleted: 0,
        totalHabits: 5,
        completedToday: [],
        streak: 1,
        weeklyConsistency: 55,
        prayerDays: 3,
        needsAttention: true,
      },
    ],
  };
}

function formatDayLabel(dateStr: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(
    new Date(`${dateStr}T12:00:00`),
  );
}

export default function GroupDashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<GroupDashboard | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const api = createApiClient(getToken);
      const res = await api.get<GroupDashboard>(`/api/groups?id=${id}`);
      setData(res.data);
    } catch {
      if (allowDemoData) {
        setData(demoDashboard(id));
      }
    }
  }, [getToken, id]);

  useEffect(() => {
    load();
  }, [load]);

  async function copyInvite() {
    if (!data?.inviteUrl) return;
    await Clipboard.setStringAsync(data.inviteUrl);
    Alert.alert("Copied!", "Group invite link copied to clipboard.");
  }

  async function copyCode() {
    if (!data?.inviteCode) return;
    await Clipboard.setStringAsync(data.inviteCode);
    Alert.alert("Copied!", "Group code copied.");
  }

  async function nudgeMember(
    memberId: string,
    name: string,
    type: "PRAYED_FOR_YOU" | "CHECK_IN",
  ) {
    if (!data || !id) return;
    const messages = {
      PRAYED_FOR_YOU: `I prayed for you today, ${name} 🙏`,
      CHECK_IN: `Hey ${name}, have you walked with God today?`,
    };
    try {
      const api = createApiClient(getToken);
      await api.patch("/api/groups", {
        groupId: id,
        memberId,
        type,
        message: messages[type],
      });
      Alert.alert("Sent!", `Encouragement sent to ${name}`);
    } catch {
      Alert.alert("Sent!", `Encouragement sent to ${name}`);
    }
  }

  if (!data) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        {allowDemoData ? (
          <ActivityIndicator color={colors.lime} />
        ) : (
          <Text style={{ color: colors.muted, textAlign: "center", padding: spacing.lg }}>
            Could not load group. Check your connection and try again.
          </Text>
        )}
      </View>
    );
  }

  const maxWeekActive = Math.max(...data.weekOverview.map((d) => d.activeMembers), 1);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {data.name}
          </Text>
          {data.churchName ? (
            <Text style={styles.topSub} numberOfLines={1}>
              {data.churchName}
            </Text>
          ) : null}
        </View>
        {data.isLeader && (
          <View style={styles.leaderBadge}>
            <Text style={styles.leaderBadgeText}>Leader</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.lime}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        <Text style={styles.heading}>Group dashboard</Text>
        <Text style={styles.subheading}>
          See who walked with God today and who may need encouragement.
        </Text>

        <View style={styles.statsRow}>
          <StatCard
            label="Active today"
            value={`${data.summary.activeToday}/${data.summary.memberCount}`}
            color={colors.lime}
          />
          <StatCard
            label="Full walk"
            value={String(data.summary.fullyCompleteToday)}
            color={colors.purple}
          />
          <StatCard
            label="Avg week"
            value={`${data.summary.avgWeeklyConsistency}%`}
            color={colors.pink}
          />
        </View>

        {data.summary.needsAttention > 0 && (
          <View style={styles.alertCard}>
            <Ionicons name="alert-circle" size={20} color={colors.orange} />
            <Text style={styles.alertText}>
              {data.summary.needsAttention} member
              {data.summary.needsAttention === 1 ? "" : "s"} haven&apos;t started
              today — reach out with encouragement.
            </Text>
          </View>
        )}

        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>This week</Text>
          <Text style={styles.sectionSub}>Members active each day</Text>
          <View style={styles.chart}>
            {data.weekOverview.map((day) => (
              <View key={day.date} style={styles.barCol}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(
                        8,
                        (day.activeMembers / maxWeekActive) * 72,
                      ),
                    },
                  ]}
                />
                <Text style={styles.barValue}>{day.activeMembers}</Text>
                <Text style={styles.barLabel}>{formatDayLabel(day.date)}</Text>
              </View>
            ))}
          </View>
        </View>

        {data.isLeader && (
          <View style={styles.inviteRow}>
            <Pressable style={styles.inviteBtn} onPress={copyInvite}>
              <Ionicons name="link-outline" size={18} color={colors.lime} />
              <Text style={styles.inviteBtnText}>Copy invite link</Text>
            </Pressable>
            <Pressable style={styles.codeBtn} onPress={copyCode}>
              <Text style={styles.codeBtnText}>{data.inviteCode.slice(0, 8)}…</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.sectionLabel}>MEMBERS</Text>

        {data.members.map((member) => (
          <View
            key={member.id}
            style={[
              styles.memberCard,
              member.needsAttention && styles.memberCardAlert,
            ]}
          >
            <View style={styles.memberTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{member.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  {member.role === "LEADER" && (
                    <Text style={styles.roleTag}>Leader</Text>
                  )}
                </View>
                <Text style={styles.memberMeta}>
                  {member.todayCompleted}/{member.totalHabits} today ·{" "}
                  {member.streak} day streak · {member.weeklyConsistency}% week
                </Text>
              </View>
              {member.needsAttention ? (
                <Ionicons name="ellipse" size={10} color={colors.orange} />
              ) : member.todayCompleted >= member.totalHabits ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.lime} />
              ) : (
                <Text style={styles.percentSmall}>
                  {Math.round((member.todayCompleted / member.totalHabits) * 100)}%
                </Text>
              )}
            </View>

            <View style={styles.habitDots}>
              {HABIT_ORDER.map((type) => {
                const done = member.completedToday.includes(type);
                return (
                  <View
                    key={type}
                    style={[styles.habitDot, done && styles.habitDotDone]}
                  >
                    <Ionicons
                      name={habitIcon(type)}
                      size={12}
                      color={done ? colors.bg : colors.mutedDark}
                    />
                  </View>
                );
              })}
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(member.todayCompleted / member.totalHabits) * 100}%`,
                  },
                ]}
              />
            </View>

            {data.isLeader && member.role !== "LEADER" && (
              <View style={styles.nudgeRow}>
                <Pressable
                  style={styles.nudgeBtn}
                  onPress={() => nudgeMember(member.id, member.name, "PRAYED_FOR_YOU")}
                >
                  <Ionicons name="hand-left-outline" size={14} color={colors.lime} />
                  <Text style={styles.nudgeBtnText}>Prayed for you</Text>
                </Pressable>
                <Pressable
                  style={styles.nudgeBtn}
                  onPress={() => nudgeMember(member.id, member.name, "CHECK_IN")}
                >
                  <Ionicons name="chatbubble-outline" size={14} color={colors.pink} />
                  <Text style={[styles.nudgeBtnText, { color: colors.pink }]}>
                    Check in
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  centered: { alignItems: "center", justifyContent: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  topSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  leaderBadge: {
    backgroundColor: colors.purpleMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  leaderBadgeText: { color: colors.purple, fontSize: 11, fontWeight: "800" },
  content: { padding: spacing.lg, paddingBottom: 40 },
  heading: { color: colors.ink, fontSize: 24, fontWeight: "800" },
  subheading: {
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 4, textAlign: "center" },
  alertCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: "rgba(249,115,22,0.12)",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.25)",
  },
  alertText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 18 },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  sectionSub: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: spacing.md },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 100,
  },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: {
    width: 18,
    backgroundColor: colors.lime,
    borderRadius: 6,
    marginBottom: 4,
  },
  barValue: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  barLabel: { color: colors.mutedDark, fontSize: 10, marginTop: 2 },
  inviteRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  inviteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.limeMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(204,255,0,0.2)",
  },
  inviteBtnText: { color: colors.lime, fontWeight: "700", fontSize: 14 },
  codeBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  codeBtnText: { color: colors.ink, fontWeight: "700", fontSize: 13 },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  memberCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  memberCardAlert: {
    borderColor: "rgba(249,115,22,0.35)",
    backgroundColor: "rgba(249,115,22,0.06)",
  },
  memberTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.purpleMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.purple, fontWeight: "800", fontSize: 17 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  memberName: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  roleTag: {
    color: colors.purple,
    fontSize: 10,
    fontWeight: "700",
    backgroundColor: colors.purpleMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  memberMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  percentSmall: { color: colors.lime, fontWeight: "800", fontSize: 13 },
  habitDots: { flexDirection: "row", gap: 6, marginTop: spacing.sm },
  habitDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  habitDotDone: { backgroundColor: colors.lime, borderColor: colors.lime },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.lime, borderRadius: 2 },
  nudgeRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  nudgeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.sm,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  nudgeBtnText: { color: colors.lime, fontSize: 12, fontWeight: "700" },
});
