import { useAuth } from "../../lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FastingRing } from "../../components/FastingRing";
import { createApiClient } from "../../lib/api";
import {
  endFast,
  FAST_PLANS,
  formatDateTime,
  formatDuration,
  formatDurationShort,
  getDefaultPlan,
  getFastEndTime,
  getFastProgress,
  getFastRemainingMs,
  isFastComplete,
  loadFastSession,
  startFast,
  type FastPlan,
  type FastSession,
} from "../../lib/fasting";
import { colors, radius, spacing } from "../../lib/theme";

export default function FastingScreen() {
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<FastSession | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<FastPlan>(getDefaultPlan());
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const completedAlertShown = useRef(false);

  const refresh = useCallback(async () => {
    const saved = await loadFastSession();
    setSession(saved);
    if (saved) {
      const plan = FAST_PLANS.find((p) => p.id === saved.planId) ?? getDefaultPlan();
      setSelectedPlan(plan);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!session?.active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session?.active]);

  useEffect(() => {
    if (!session?.active) {
      completedAlertShown.current = false;
      return;
    }
    if (!isFastComplete(session, now) || completedAlertShown.current) return;
    completedAlertShown.current = true;
    Alert.alert("Fast complete! 🙌", "Well done. Mark your fast habit on Today's Walk.", [
      { text: "Keep going", style: "cancel" },
      { text: "End fast", onPress: () => handleEndFast(true) },
    ]);
  }, [session, now]);

  async function handleStartFast() {
    const next = await startFast(selectedPlan);
    setSession(next);
    setNow(Date.now());
  }

  async function handleEndFast(markHabit = false) {
    await endFast();
    setSession(null);
    if (markHabit) {
      try {
        const api = createApiClient(getToken);
        await api.post("/api/habits", { type: "FASTING" });
      } catch {
        /* offline */
      }
    }
  }

  function confirmEndFast() {
    Alert.alert("End fast?", "Your timer will stop.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End fast",
        style: "destructive",
        onPress: () => handleEndFast(true),
      },
    ]);
  }

  if (loading) {
    return <View style={[styles.root, { paddingTop: insets.top }]} />;
  }

  const isActive = !!session?.active;
  const progress = session ? getFastProgress(session, now) : 0;
  const remaining = session ? getFastRemainingMs(session, now) : 0;
  const elapsed = session ? now - session.startedAt : 0;
  const endTime = session ? getFastEndTime(session) : Date.now() + selectedPlan.hours * 3600000;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>
          {isActive ? "You are fasting" : "Fasting"}
        </Text>
        <Text style={styles.subheader}>
          {isActive
            ? "Stay focused — God honors your sacrifice"
            : "Choose a plan and begin when you're ready"}
        </Text>

        {isActive && session && (
          <View style={styles.planPill}>
            <Ionicons name="leaf" size={14} color={colors.lime} />
            <Text style={styles.planPillText}>{session.planLabel} fast</Text>
          </View>
        )}

        <View style={styles.ringWrap}>
          <FastingRing size={280} strokeWidth={12} progress={isActive ? progress : 0}>
            <Text style={styles.ringLabel}>
              {isActive ? "Time remaining" : "Select plan"}
            </Text>
            <Text style={styles.ringTimer}>
              {isActive ? formatDuration(remaining) : formatDurationShort(selectedPlan.hours * 3600000)}
            </Text>
            {isActive && (
              <Text style={styles.ringMeta}>
                Elapsed {Math.round(progress)}% · {formatDurationShort(elapsed)} in
              </Text>
            )}
          </FastingRing>
        </View>

        {!isActive && (
          <View style={styles.plans}>
            {FAST_PLANS.map((plan) => {
              const active = selectedPlan.id === plan.id;
              return (
                <Pressable
                  key={plan.id}
                  style={[styles.planCard, active && styles.planCardActive]}
                  onPress={() => setSelectedPlan(plan)}
                >
                  <Text style={[styles.planLabel, active && styles.planLabelActive]}>
                    {plan.label}
                  </Text>
                  <Text style={styles.planDesc}>{plan.description}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.timeRow}>
          <View style={styles.timeCard}>
            <View style={styles.timeCardHeader}>
              <View style={[styles.dot, { backgroundColor: colors.lime }]} />
              <Text style={styles.timeCardLabel}>Fast started</Text>
            </View>
            <Text style={styles.timeCardValue}>
              {isActive && session
                ? formatDateTime(session.startedAt)
                : "Not started"}
            </Text>
          </View>
          <View style={styles.timeCard}>
            <View style={styles.timeCardHeader}>
              <View style={[styles.dot, { backgroundColor: colors.orange }]} />
              <Text style={styles.timeCardLabel}>Fast ending</Text>
            </View>
            <Text style={styles.timeCardValue}>
              {isActive && session
                ? formatDateTime(endTime)
                : formatDateTime(Date.now() + selectedPlan.hours * 3600000)}
            </Text>
          </View>
        </View>

        {isActive ? (
          <View style={styles.actions}>
            <Pressable style={styles.endBtn} onPress={confirmEndFast}>
              <Ionicons name="stop" size={18} color={colors.bg} />
              <Text style={styles.endBtnText}>End Fast</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.startBtn} onPress={handleStartFast}>
            <Ionicons name="play" size={20} color={colors.bg} />
            <Text style={styles.startBtnText}>Start Fasting</Text>
          </Pressable>
        )}

        <View style={styles.tipCard}>
          <Ionicons name="book-outline" size={18} color={colors.muted} />
          <Text style={styles.tipText}>
            Fasting isn&apos;t only food — social media, entertainment, or anything that
            distracts you from God counts too.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 120 },
  header: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  subheader: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  planPill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.limeMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: spacing.md,
  },
  planPillText: { color: colors.lime, fontWeight: "800", fontSize: 13 },
  ringWrap: { alignItems: "center", marginVertical: spacing.lg },
  ringLabel: { color: colors.muted, fontSize: 13, marginBottom: 8 },
  ringTimer: {
    color: colors.ink,
    fontSize: 42,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: 1,
  },
  ringMeta: { color: colors.orange, fontSize: 12, marginTop: 8, fontWeight: "600" },
  plans: { gap: spacing.sm, marginBottom: spacing.lg },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  planCardActive: {
    borderColor: colors.lime,
    backgroundColor: colors.limeMuted,
  },
  planLabel: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  planLabelActive: { color: colors.lime },
  planDesc: { color: colors.muted, fontSize: 12, marginTop: 4 },
  timeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  timeCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  timeCardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  timeCardLabel: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  timeCardValue: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  startBtnText: { color: colors.bg, fontSize: 17, fontWeight: "800" },
  actions: { marginBottom: spacing.lg },
  endBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  endBtnText: { color: colors.bg, fontSize: 17, fontWeight: "800" },
  tipCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tipText: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 19 },
});
