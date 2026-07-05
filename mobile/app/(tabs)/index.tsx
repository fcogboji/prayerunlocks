import { useAuth, useUser } from "../../lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CircularProgress } from "../../components/CircularProgress";
import {
  createApiClient,
  habitIcon,
  type HabitsResponse,
  type Nudge,
  type Partner,
  type PrayerUnlock,
} from "../../lib/api";
import { allowDemoData } from "../../lib/dev";
import { colors, radius, spacing } from "../../lib/theme";

const SITUATION_PROMPTS = [
  "I'm anxious about my future",
  "I lost my job",
  "My relationship is struggling",
  "I feel spiritually dry",
  "I'm dealing with grief",
];

function demoUnlock(situation: string): PrayerUnlock {
  return {
    encouragement: "God sees exactly where you are — prayer is how you invite Him into it.",
    verses: [
      {
        reference: "Philippians 4:6-7",
        text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
        why: "This verse was written for real pressure — bring your situation to God honestly.",
      },
      {
        reference: "Psalm 34:17",
        text: "The righteous cry out, and the Lord hears them; he delivers them from all their troubles.",
        why: "God hears you before the situation changes. Prayer comes first.",
      },
    ],
    prayerType: "Prayer of release and trust",
    prayerTypeExplain:
      "When life feels heavy, surrender prayers name the burden and hand it to God step by step.",
    howToPray: [
      "Name your situation out loud — no filter.",
      "Read each verse slowly and ask what God is saying.",
      "Pray the sample prayer below in your own words.",
    ],
    samplePrayer: `Lord, I'm walking through ${situation.slice(0, 80)}. I need Your wisdom and peace. Teach me how to pray through this and stay close to You. Amen.`,
    consistencyTip: "Return to God daily — consistency builds faith that outlasts any situation.",
  };
}

export default function HomeScreen() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<HabitsResponse | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [situation, setSituation] = useState("");
  const [unlock, setUnlock] = useState<PrayerUnlock | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const firstName = user?.firstName ?? "Friend";

  const load = useCallback(async () => {
    const api = createApiClient(getToken);
    try {
      const [habitsRes, partnersRes] = await Promise.all([
        api.get<HabitsResponse>("/api/habits"),
        api.get<{ partners: Partner[]; unreadNudges: Nudge[] }>("/api/partners"),
      ]);
      setData(habitsRes.data);
      setPartners(partnersRes.data.partners);
      setNudges(partnersRes.data.unreadNudges);
    } catch {
      if (!allowDemoData) return;
      setData({
        habits: [
          { type: "PRAYER", title: "Pray", description: "", action: "", badge: "1", completed: false },
          { type: "BIBLE", title: "Read Scripture", description: "", action: "", badge: "2", completed: false },
          { type: "DEVOTIONAL", title: "Reflect", description: "", action: "", badge: "3", completed: false },
          { type: "FASTING", title: "Fast", description: "", action: "", badge: "4", completed: false },
          { type: "ENCOURAGE", title: "Encourage", description: "", action: "", badge: "5", completed: false },
        ],
        completedCount: 0,
        totalCount: 5,
        streak: 0,
        tier: "FREE",
      });
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitUnlock(text?: string) {
    const value = (text ?? situation).trim();
    if (!value) return;
    setSituation(value);
    setUnlocking(true);
    setUnlock(null);
    try {
      const api = createApiClient(getToken);
      const res = await api.post<{ unlock: PrayerUnlock }>("/api/unlock", {
        situation: value,
      });
      setUnlock(res.data.unlock);
    } catch {
      if (allowDemoData) {
        setUnlock(demoUnlock(value));
      }
    } finally {
      setUnlocking(false);
    }
  }

  async function toggle(type: string) {
    try {
      const api = createApiClient(getToken);
      await api.post("/api/habits", { type });
      await load();
    } catch {
      setData((prev) => {
        if (!prev) return prev;
        const habits = prev.habits.map((h) =>
          h.type === type ? { ...h, completed: !h.completed } : h,
        );
        return {
          ...prev,
          habits,
          completedCount: habits.filter((h) => h.completed).length,
        };
      });
    }
  }

  const completed = data?.completedCount ?? 0;
  const total = data?.totalCount ?? 5;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const streak = data?.streak ?? 0;
  const habits = data?.habits ?? [];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top + spacing.md }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>PrayerUnlocks</Text>
            <Text style={styles.greeting}>Pray your way through it</Text>
            <Text style={styles.subGreeting}>Good {getDayPart()}, {firstName}</Text>
          </View>
          <Pressable style={styles.streakPill} onPress={() => router.push("/(tabs)/insights")}>
            <Ionicons name="flame" size={16} color={colors.orange} />
            <Text style={styles.streakText}>{streak}d</Text>
          </Pressable>
        </View>

        <View style={styles.unlockCard}>
          <View style={styles.unlockHeader}>
            <Ionicons name="lock-open-outline" size={22} color={colors.lime} />
            <Text style={styles.unlockTitle}>What&apos;s your situation?</Text>
          </View>
          <Text style={styles.unlockSub}>
            Describe what you&apos;re facing. We&apos;ll recommend Scripture to read and the
            type of prayer that can help you through it.
          </Text>

          <TextInput
            style={styles.situationInput}
            placeholder="e.g. I'm anxious about losing my job and don't know what to do..."
            placeholderTextColor={colors.mutedDark}
            value={situation}
            onChangeText={setSituation}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.promptRow}>
            {SITUATION_PROMPTS.map((p) => (
              <Pressable key={p} style={styles.promptChip} onPress={() => submitUnlock(p)}>
                <Text style={styles.promptText}>{p}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.unlockBtn, unlocking && styles.unlockBtnDisabled]}
            onPress={() => submitUnlock()}
            disabled={unlocking || !situation.trim()}
          >
            {unlocking ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color={colors.bg} />
                <Text style={styles.unlockBtnText}>Unlock prayer & Scripture</Text>
              </>
            )}
          </Pressable>
        </View>

        {unlock && (
          <View style={styles.results}>
            <Text style={styles.encouragement}>{unlock.encouragement}</Text>

            <Text style={styles.resultLabel}>SCRIPTURE FOR YOU</Text>
            {unlock.verses.map((v) => (
              <View key={v.reference} style={styles.verseCard}>
                <Text style={styles.verseRef}>{v.reference}</Text>
                <Text style={styles.verseText}>&ldquo;{v.text}&rdquo;</Text>
                <Text style={styles.verseWhy}>{v.why}</Text>
              </View>
            ))}

            <Text style={styles.resultLabel}>TYPE OF PRAYER</Text>
            <View style={styles.prayerTypeCard}>
              <Text style={styles.prayerTypeName}>{unlock.prayerType}</Text>
              <Text style={styles.prayerTypeExplain}>{unlock.prayerTypeExplain}</Text>
            </View>

            <Text style={styles.resultLabel}>HOW TO PRAY</Text>
            {unlock.howToPray.map((step, i) => (
              <View key={step} style={styles.stepRow}>
                <Text style={styles.stepNum}>{i + 1}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}

            <Text style={styles.resultLabel}>PRAY THIS NOW</Text>
            <View style={styles.samplePrayerCard}>
              <Text style={styles.samplePrayer}>{unlock.samplePrayer}</Text>
            </View>

            <View style={styles.tipCard}>
              <Ionicons name="footsteps-outline" size={18} color={colors.lime} />
              <Text style={styles.tipText}>{unlock.consistencyTip}</Text>
            </View>

            <Pressable style={styles.coachLink} onPress={() => router.push("/(tabs)/coach")}>
              <Text style={styles.coachLinkText}>Want deeper explanation? Ask AI coach ›</Text>
            </Pressable>
          </View>
        )}

        {nudges.length > 0 && (
          <Pressable style={styles.nudgeBanner} onPress={() => router.push("/(tabs)/community")}>
            <Ionicons name="heart" size={18} color={colors.pink} />
            <Text style={styles.nudgeTitle}>
              {nudges[0].fromUser.name ?? "Someone"} prayed for you
            </Text>
          </Pressable>
        )}

        <View style={styles.consistencyCard}>
          <CircularProgress
            size={56}
            strokeWidth={4}
            progress={percent}
            color={colors.lime}
            label={`${completed}/${total}`}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.consistencyTitle}>Stay consistent with God</Text>
            <Text style={styles.consistencySub}>Daily walk · {percent}% today</Text>
          </View>
          <Pressable onPress={() => router.push("/(tabs)/insights")}>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Today&apos;s habits</Text>
        {habits.map((habit) => (
          <Pressable
            key={habit.type}
            style={styles.habitCard}
            onPress={() => {
              if (habit.type === "FASTING") {
                router.push("/(tabs)/fasting");
                return;
              }
              toggle(habit.type);
            }}
          >
            <View style={[styles.habitIconWrap, habit.completed && styles.habitIconDone]}>
              <Ionicons
                name={habitIcon(habit.type)}
                size={18}
                color={habit.completed ? colors.bg : colors.lime}
              />
            </View>
            <Text style={styles.habitTitle}>{habit.title}</Text>
            <View style={[styles.checkbox, habit.completed && styles.checkboxDone]}>
              {habit.completed && <Ionicons name="checkmark" size={14} color={colors.bg} />}
            </View>
          </Pressable>
        ))}

        {partners.length === 0 && (
          <Pressable style={styles.inviteCard} onPress={() => router.push("/(tabs)/community")}>
            <Ionicons name="people-outline" size={20} color={colors.lime} />
            <Text style={styles.inviteTitle}>Walk with an accountability partner</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getDayPart() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  greeting: { color: colors.ink, fontSize: 28, fontWeight: "800", marginTop: 4 },
  subGreeting: { color: colors.muted, fontSize: 14, marginTop: 4 },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(249,115,22,0.12)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  streakText: { color: colors.orange, fontWeight: "800", fontSize: 13 },
  unlockCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(204,255,0,0.15)",
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  unlockHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  unlockTitle: { color: colors.ink, fontSize: 20, fontWeight: "800" },
  unlockSub: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  situationInput: {
    marginTop: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    color: colors.ink,
    fontSize: 15,
    minHeight: 100,
    lineHeight: 22,
  },
  promptRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.sm },
  promptChip: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.line,
  },
  promptText: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.lime,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginTop: spacing.md,
  },
  unlockBtnDisabled: { opacity: 0.6 },
  unlockBtnText: { color: colors.bg, fontWeight: "800", fontSize: 15 },
  results: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  encouragement: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    marginBottom: spacing.lg,
    fontStyle: "italic",
  },
  resultLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  verseCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  verseRef: { color: colors.lime, fontWeight: "800", fontSize: 14 },
  verseText: { color: colors.ink, fontSize: 14, lineHeight: 21, marginTop: 6 },
  verseWhy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  prayerTypeCard: {
    backgroundColor: colors.purpleMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.2)",
  },
  prayerTypeName: { color: colors.purple, fontWeight: "800", fontSize: 16 },
  prayerTypeExplain: { color: colors.ink, fontSize: 13, lineHeight: 19, marginTop: 6 },
  stepRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.limeMuted,
    color: colors.lime,
    fontWeight: "800",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 22,
    overflow: "hidden",
  },
  stepText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 19 },
  samplePrayerCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.limeMuted,
    marginBottom: spacing.md,
  },
  samplePrayer: { color: colors.ink, fontSize: 15, lineHeight: 24 },
  tipCard: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  tipText: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 18 },
  coachLink: { marginTop: spacing.md, alignItems: "center" },
  coachLinkText: { color: colors.purple, fontWeight: "600", fontSize: 13 },
  nudgeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.pinkMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  nudgeTitle: { color: colors.ink, fontWeight: "700", fontSize: 14 },
  consistencyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  consistencyTitle: { color: colors.ink, fontWeight: "700", fontSize: 14 },
  consistencySub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  habitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  habitIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.limeMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  habitIconDone: { backgroundColor: colors.lime },
  habitTitle: { flex: 1, color: colors.ink, fontWeight: "600", fontSize: 14 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.mutedDark,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: { backgroundColor: colors.lime, borderColor: colors.lime },
  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  inviteTitle: { color: colors.muted, fontSize: 13, fontWeight: "600" },
});
