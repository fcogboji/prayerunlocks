import { useAuth } from "../../lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CircularProgress } from "../../components/CircularProgress";
import { createApiClient, openPremiumCheckout, type HabitsResponse, type WeeklyInsights } from "../../lib/api";
import { allowDemoData } from "../../lib/dev";
import { colors, radius, spacing } from "../../lib/theme";

const HABIT_LABELS: Record<string, string> = {
  PRAYER: "Prayer",
  BIBLE: "Bible",
  DEVOTIONAL: "Reflect",
  FASTING: "Fast",
  ENCOURAGE: "Encourage",
};

const RING_COLORS = ["#facc15", "#22d3ee", "#fb923c", "#f472b6", "#a78bfa"];

export default function InsightsScreen() {
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();
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

  const streak = habits?.streak ?? 0;
  const rings =
    habits?.habits.map((h, i) => ({
      label: HABIT_LABELS[h.type] ?? h.title,
      value: h.completed ? streak || 1 : 0,
      color: RING_COLORS[i % RING_COLORS.length],
      active: h.completed,
    })) ?? [];

  const barDays = insights?.days ?? [];
  const maxCompleted = Math.max(...barDays.map((d) => d.completed.length), 1);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Streaks</Text>
        <Text style={styles.subtitle}>{insights?.weeklyConsistency ?? 0}% consistency this week</Text>

        <View style={styles.heroCard}>
          <Ionicons name="flame" size={28} color={colors.orange} />
          <Text style={styles.heroNum}>{streak}</Text>
          <Text style={styles.heroLabel}>day streak</Text>
        </View>

        <View style={styles.grid}>
          {rings.map((ring) => (
            <View key={ring.label} style={styles.ringCell}>
              <View style={[styles.ringGlow, { shadowColor: ring.color }]}>
                <CircularProgress
                  size={64}
                  strokeWidth={5}
                  progress={ring.active ? 100 : 0}
                  color={ring.color}
                  label={ring.active ? "✓" : "·"}
                />
              </View>
              <Text style={styles.ringLabel}>{ring.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{insights?.prayerDays ?? 0}</Text>
            <Text style={styles.statLabel}>Prayer days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>
              {insights?.advancedLocked ? "—" : (insights?.nudgesSent ?? 0)}
            </Text>
            <Text style={styles.statLabel}>Nudges sent</Text>
          </View>
        </View>

        {insights?.advancedLocked && (
          <Pressable style={styles.upsellCard} onPress={() => openPremiumCheckout(getToken)}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.lime} />
            <View style={{ flex: 1 }}>
              <Text style={styles.upsellTitle}>Advanced insights</Text>
              <Text style={styles.upsellBody}>
                Unlock weekly breakdown and encouragement stats with Premium.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        )}

        {!insights?.advancedLocked && (
        <View style={styles.healthSection}>
          <Text style={styles.sectionTitle}>This week</Text>
          <View style={styles.barChart}>
            {barDays.map((day, i) => {
              const height = (day.completed.length / 5) * 72 + 12;
              const label = new Date(day.date).toLocaleDateString("en-GB", {
                weekday: "short",
              })[0];
              return (
                <View key={day.date} style={styles.barCol}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                        backgroundColor:
                          day.completed.length >= 5
                            ? colors.lime
                            : day.completed.length >= 3
                              ? colors.purple
                              : colors.mutedDark,
                        opacity: 0.4 + (day.completed.length / maxCompleted) * 0.6,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },
  title: { color: colors.ink, fontSize: 32, fontWeight: "800" },
  subtitle: { color: colors.lime, fontSize: 14, fontWeight: "600", marginBottom: spacing.lg },
  heroCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.2)",
  },
  heroNum: {
    fontSize: 56,
    fontWeight: "800",
    color: colors.orange,
    lineHeight: 60,
    marginTop: spacing.sm,
  },
  heroLabel: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.lg,
    marginBottom: spacing.lg,
  },
  ringCell: { width: "18%", alignItems: "center", gap: 6 },
  ringGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  ringLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statNum: { color: colors.ink, fontSize: 24, fontWeight: "800" },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 4 },
  healthSection: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 96,
    gap: 6,
  },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 6 },
  bar: { width: "100%", borderRadius: 6, minHeight: 12 },
  barLabel: { color: colors.mutedDark, fontSize: 10, fontWeight: "600" },
  upsellCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.limeMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(204,255,0,0.2)",
  },
  upsellTitle: { color: colors.ink, fontWeight: "700", fontSize: 14 },
  upsellBody: { color: colors.muted, fontSize: 12, marginTop: 2, lineHeight: 16 },
});
