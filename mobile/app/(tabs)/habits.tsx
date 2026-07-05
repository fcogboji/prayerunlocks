import { useAuth } from "../../lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CircularProgress } from "../../components/CircularProgress";
import { createApiClient, type Habit, type HabitsResponse } from "../../lib/api";
import { colors, radius, spacing } from "../../lib/theme";
import { allowDemoData } from "../../lib/dev";

const HABIT_STYLES: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  PRAYER: { color: colors.purple, icon: "hand-left-outline" },
  BIBLE: { color: colors.orange, icon: "book-outline" },
  DEVOTIONAL: { color: colors.mint, icon: "sunny-outline" },
  ENCOURAGE: { color: colors.coral, icon: "heart-outline" },
  FASTING: { color: colors.blue, icon: "leaf-outline" },
};

const EXTRA_HABITS: Habit[] = [
  {
    type: "FASTING",
    title: "No Social Media",
    description: "3",
    action: "Done",
    badge: "3",
    completed: true,
  },
];

export default function HabitsScreen() {
  const { getToken } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<HabitsResponse | null>(null);

  const load = useCallback(async () => {
    try {
      const api = createApiClient(getToken);
      const res = await api.get<HabitsResponse>("/api/habits");
      setData(res.data);
    } catch {
      if (!allowDemoData) return;
      setData({
        habits: [
          { type: "PRAYER", title: "Morning Meditation", description: "5", action: "Done", badge: "5", completed: true },
          { type: "BIBLE", title: "Exercise", description: "2", action: "Done", badge: "2", completed: true },
          { type: "DEVOTIONAL", title: "Read 30 minutes", description: "3", action: "Done", badge: "3", completed: true },
          { type: "ENCOURAGE", title: "Drink 8 glasses of water", description: "4", action: "Done", badge: "4", completed: true },
        ],
        completedCount: 5,
        totalCount: 5,
        streak: 7,
        tier: "Soldier of Faith",
      });
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(type: string) {
    try {
      const api = createApiClient(getToken);
      await api.post("/api/habits", { type });
      await load();
    } catch {
      if (!allowDemoData) return;
    }
  }

  const habits = [...(data?.habits ?? []), ...EXTRA_HABITS];
  const completed = data?.completedCount ?? habits.filter((h) => h.completed).length;
  const total = Math.max(data?.totalCount ?? habits.length, habits.length);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = percent >= 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <View>
          <Text style={styles.greeting}>Good morning ☀️</Text>
          <Text style={styles.date}>
            {new Intl.DateTimeFormat("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            }).format(new Date())}
          </Text>
        </View>
        <Pressable style={styles.addBtn}>
          <Ionicons name="add" size={22} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progressCard}>
          <CircularProgress
            progress={percent}
            color={colors.mint}
            label={`${percent}%`}
            sublabel="done"
          />
          <View style={styles.progressInfo}>
            <Text style={styles.progressTitle}>{allDone ? "All done! 🎉" : "Keep going!"}</Text>
            <Text style={styles.progressSub}>
              {completed}/{total} habits completed
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>TODAY&apos;S HABITS</Text>

        {habits.map((habit) => {
          const style = HABIT_STYLES[habit.type] ?? { color: colors.purple, icon: "ellipse-outline" };
          return (
            <Pressable
              key={habit.type}
              style={styles.habitCard}
              onPress={() => toggle(habit.type)}
            >
              <View style={[styles.accent, { backgroundColor: style.color }]} />
              <View style={[styles.habitIcon, { backgroundColor: `${style.color}22` }]}>
                <Ionicons name={style.icon} size={20} color={style.color} />
              </View>
              <View style={styles.habitInfo}>
                <Text style={styles.habitTitle}>{habit.title}</Text>
                <Text style={styles.habitCount}>{habit.description}</Text>
              </View>
              <View
                style={[
                  styles.checkBtn,
                  { backgroundColor: habit.completed ? style.color : "transparent", borderColor: style.color },
                ]}
              >
                {habit.completed && <Ionicons name="checkmark" size={16} color={colors.bg} />}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: { color: colors.muted, fontSize: 13 },
  date: { color: colors.ink, fontSize: 22, fontWeight: "800" },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: spacing.lg, paddingBottom: 100 },
  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  progressInfo: { flex: 1 },
  progressTitle: { color: colors.ink, fontSize: 20, fontWeight: "800" },
  progressSub: { color: colors.muted, fontSize: 13, marginTop: 4, marginBottom: spacing.sm },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.mint, borderRadius: 3 },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  habitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  accent: { width: 4, alignSelf: "stretch" },
  habitIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  habitInfo: { flex: 1, paddingVertical: spacing.md },
  habitTitle: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  habitCount: { color: colors.muted, fontSize: 12, marginTop: 2 },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
});
