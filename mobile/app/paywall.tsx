import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth";
import { openPremiumCheckout } from "../lib/api";
import { useSubscription } from "../lib/subscription";
import { colors, radius, spacing } from "../lib/theme";

const PREMIUM_FEATURES = [
  { icon: "sparkles-outline" as const, text: "Unlimited AI Bible coach" },
  { icon: "people-outline" as const, text: "Unlimited accountability partners" },
  { icon: "business-outline" as const, text: "Lead up to 10 church groups" },
  { icon: "bar-chart-outline" as const, text: "Advanced streak insights" },
];

const FREE_FEATURES = [
  "Prayer unlocks for any situation",
  "Daily habits & streaks",
  "1 accountability partner",
  "1 church group",
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { welcome } = useLocalSearchParams<{ welcome?: string }>();
  const { getToken } = useAuth();
  const { isPremium, refresh } = useSubscription();
  const [loading, setLoading] = useState(false);

  const isWelcome = welcome === "1";

  useEffect(() => {
    if (isPremium) {
      router.replace("/(tabs)");
    }
  }, [isPremium, router]);

  function continueToApp() {
    router.replace("/(tabs)");
  }

  async function handleSubscribe() {
    setLoading(true);
    try {
      await openPremiumCheckout(getToken, () => {
        refresh();
      });
      await refresh();
      if (isPremium) {
        continueToApp();
      }
    } finally {
      setLoading(false);
    }
  }

  if (isPremium) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PREMIUM</Text>
        </View>

        <Text style={styles.title}>
          {isWelcome ? "Welcome to PrayerUnlocks" : "Go deeper in your walk"}
        </Text>
        <Text style={styles.subtitle}>
          {isWelcome
            ? "Prayer unlocks are free forever. Premium adds AI coaching and community tools."
            : "Unlock the full AI coach, unlimited partners, and leader tools."}
        </Text>

        <View style={styles.premiumCard}>
          <LinearGradient
            colors={[colors.gradientPink, colors.gradientPurple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.price}>$4.99</Text>
          <Text style={styles.priceUnit}>/month</Text>
          <View style={styles.featureList}>
            {PREMIUM_FEATURES.map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <Ionicons name={f.icon} size={18} color="#fff" />
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.freeCard}>
          <Text style={styles.freeTitle}>Free plan includes</Text>
          {FREE_FEATURES.map((f) => (
            <View key={f} style={styles.freeRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.lime} />
              <Text style={styles.freeText}>{f}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={styles.subscribeBtn}
          onPress={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.subscribeText}>Subscribe — $4.99/mo</Text>
          )}
        </Pressable>

        <Pressable style={styles.skipBtn} onPress={continueToApp}>
          <Text style={styles.skipText}>Continue with free plan</Text>
        </Pressable>

        <Text style={styles.legal}>
          Payment opens in your browser (Stripe). Cancel anytime from your profile.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dashboardBg },
  content: { padding: spacing.lg },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.limeMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  badgeText: { color: colors.lime, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", lineHeight: 34 },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: spacing.sm, lineHeight: 22 },
  premiumCard: {
    marginTop: spacing.xl,
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: "hidden",
  },
  price: { color: "#fff", fontSize: 40, fontWeight: "800" },
  priceUnit: { color: "rgba(255,255,255,0.8)", fontSize: 16, marginBottom: spacing.lg },
  featureList: { gap: spacing.sm },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  featureText: { color: "#fff", fontSize: 14, fontWeight: "600", flex: 1 },
  freeCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.dashboardCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
  },
  freeTitle: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: spacing.sm },
  freeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 6 },
  freeText: { color: colors.ink, fontSize: 14 },
  subscribeBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.lime,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  subscribeText: { color: "#000", fontSize: 16, fontWeight: "800" },
  skipBtn: { marginTop: spacing.md, paddingVertical: 12, alignItems: "center" },
  skipText: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  legal: {
    marginTop: spacing.lg,
    color: colors.mutedDark,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
