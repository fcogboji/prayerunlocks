import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../../lib/theme";

const CATEGORIES = [
  {
    icon: "hand-left-outline" as const,
    label: "Prayer habit",
    hint: "Daily conversation with God",
    color: colors.purple,
  },
  {
    icon: "book-outline" as const,
    label: "Bible reading",
    hint: "Scripture in your daily walk",
    color: colors.orange,
  },
  {
    icon: "leaf-outline" as const,
    label: "Fasting discipline",
    hint: "Food, media, or chosen sacrifice",
    color: colors.lime,
  },
  {
    icon: "sunny-outline" as const,
    label: "Reflection",
    hint: "Journal what God is teaching you",
    color: colors.blue,
  },
  {
    icon: "heart-outline" as const,
    label: "Encourage someone",
    hint: "Prayer, verse, or check-in",
    color: colors.pink,
  },
  {
    icon: "people-outline" as const,
    label: "Find a partner",
    hint: "Accountability that keeps you consistent",
    color: colors.coral,
    route: "/(tabs)/community",
  },
];

export default function AddScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Grow your walk</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.lead}>
        Steadfast tracks five daily habits — not generic content. Pick what you want to focus on.
      </Text>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.label}
            style={styles.categoryCard}
            onPress={() => {
              router.back();
              setTimeout(() => {
                router.push((cat.route ?? "/(tabs)/index") as never);
              }, 100);
            }}
          >
            <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}22` }]}>
              <Ionicons name={cat.icon} size={22} color={cat.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
              <Text style={styles.categoryHint}>{cat.hint}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable style={styles.doneBtn} onPress={() => router.back()}>
          <Text style={styles.doneText}>Back to today&apos;s walk</Text>
        </Pressable>
      </View>
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
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  lead: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  categoryHint: { color: colors.muted, fontSize: 12, marginTop: 2 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  doneBtn: {
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  doneText: { color: colors.bg, fontSize: 16, fontWeight: "800" },
});
