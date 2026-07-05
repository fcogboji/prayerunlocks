import { useAuth, useUser } from "../../lib/auth";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { createApiClient, type ChatMessage } from "../../lib/api";
import { useSubscription } from "../../lib/subscription";
import { colors, radius, spacing } from "../../lib/theme";
import { allowDemoData } from "../../lib/dev";

const TOPIC_SECTIONS = [
  {
    id: "scripture",
    title: "Scripture",
    icon: "book-outline" as const,
    color: colors.pink,
    bg: colors.pinkMuted,
    prompts: ["Explain John 3:16", "What does Romans 8:28 mean?", "Help me study Psalms"],
  },
  {
    id: "growth",
    title: "Personal Growth",
    icon: "heart-outline" as const,
    color: colors.purple,
    bg: colors.purpleMuted,
    prompts: ["How do I handle anxiety biblically?", "Build a morning routine", "Stay consistent in prayer"],
  },
  {
    id: "accountability",
    title: "Accountability",
    icon: "people-outline" as const,
    color: "#2dd4bf",
    bg: "rgba(45,212,191,0.15)",
    prompts: ["Help me pray for discipline", "Encourage my partner today", "Recover after missing a day"],
  },
];

function CoachHeader({
  name,
  greeting,
  tab,
  setTab,
  isPremium,
  userImage,
  onUpgrade,
}: {
  name: string;
  greeting: string;
  tab: "topics" | "chat";
  setTab: (t: "topics" | "chat") => void;
  isPremium: boolean;
  userImage?: string | null;
  onUpgrade: () => void;
}) {
  return (
    <>
      <View style={styles.topRow}>
        <Text style={styles.dashboardLabel}>AI Coach</Text>
        <Image
          source={{
            uri: userImage ?? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
          }}
          style={styles.profilePic}
          contentFit="cover"
        />
      </View>

      <Text style={styles.greeting}>
        {greeting},{"\n"}
        {name}
      </Text>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === "topics" && styles.tabActive]}
          onPress={() => setTab("topics")}
        >
          <Text style={[styles.tabText, tab === "topics" && styles.tabTextActive]}>Topics</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "chat" && styles.tabActive]}
          onPress={() => setTab("chat")}
        >
          <Text style={[styles.tabText, tab === "chat" && styles.tabTextActive]}>Chat</Text>
        </Pressable>
      </View>

      {!isPremium && (
        <Pressable style={styles.premiumBanner} onPress={onUpgrade}>
          <LinearGradient
            colors={[colors.pinkMuted, colors.purpleMuted]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="lock-closed-outline" size={14} color={colors.pink} />
          <Text style={styles.premiumNote}>Unlock AI coach · $4.99/mo</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.pink} />
        </Pressable>
      )}
    </>
  );
}

export default function CoachScreen() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { isPremium } = useSubscription();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"topics" | "chat">("topics");
  const [openSection, setOpenSection] = useState("scripture");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const name = user?.firstName ?? "Friend";
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  const load = useCallback(async () => {
    try {
      const api = createApiClient(getToken);
      const res = await api.get<{ messages: ChatMessage[]; isPremium: boolean }>("/api/coach");
      setMessages(res.data.messages);
    } catch {
      if (!allowDemoData) return;
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function send(question: string) {
    if (!question.trim()) return;
    if (!isPremium) {
      router.push("/paywall");
      return;
    }
    setTab("chat");
    setLoading(true);
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");

    try {
      const api = createApiClient(getToken);
      const res = await api.post<{ reply: string }>("/api/coach", { question });
      setMessages((m) => [...m, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMessages((m) => [
        ...m.slice(0, -1),
        {
          role: "assistant",
          content: isPremium
            ? "Something went wrong. Please try again."
            : "AI Bible Coach is a Premium feature. Upgrade on the web app to unlock.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd(), 100);
    }
  }

  const headerProps = {
    name,
    greeting,
    tab,
    setTab,
    isPremium,
    userImage: user?.imageUrl,
    onUpgrade: () => router.push("/paywall"),
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {tab === "topics" ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <CoachHeader {...headerProps} />

          {TOPIC_SECTIONS.map((section) => {
            const open = openSection === section.id;
            return (
              <View key={section.id} style={styles.topicCard}>
                <Pressable
                  style={styles.topicHeader}
                  onPress={() => setOpenSection(open ? "" : section.id)}
                >
                  <View style={[styles.topicIcon, { backgroundColor: section.bg }]}>
                    <Ionicons name={section.icon} size={18} color={section.color} />
                  </View>
                  <Text style={styles.topicTitle}>{section.title}</Text>
                  <Ionicons
                    name={open ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.muted}
                  />
                </Pressable>

                {open &&
                  section.prompts.map((prompt) => (
                    <Pressable key={prompt} style={styles.promptRow} onPress={() => send(prompt)}>
                      <View style={styles.radio} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.promptName}>{prompt}</Text>
                        <Text style={styles.promptMeta}>Tap to ask coach</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={colors.pink} />
                    </Pressable>
                  ))}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <FlatList
          ref={listRef}
          style={styles.flex}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.chatContent}
          ListHeaderComponent={<CoachHeader {...headerProps} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <LinearGradient
                colors={[colors.gradientPink, colors.gradientPurple]}
                style={styles.emptyIcon}
              >
                <Ionicons name="sparkles" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.empty}>
                Ask for Scripture reflection, prayer prompts, or gentle accountability.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === "user" ? styles.userBubble : styles.coachBubble,
              ]}
            >
              {item.role === "assistant" && (
                <LinearGradient
                  colors={[colors.gradientPink, colors.gradientPurple]}
                  style={styles.coachDot}
                />
              )}
              <Text style={styles.bubbleLabel}>{item.role === "user" ? "You" : "Coach"}</Text>
              <Text style={styles.bubbleText}>{item.content}</Text>
            </View>
          )}
          ListFooterComponent={
            loading ? (
              <ActivityIndicator style={{ marginVertical: spacing.sm }} color={colors.pink} />
            ) : null
          }
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask your Bible coach"
          placeholderTextColor={colors.mutedDark}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send(input)}
        />
        <Pressable onPress={() => send(input)}>
          <LinearGradient
            colors={[colors.gradientPink, colors.gradientPurple]}
            style={styles.sendBtn}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dashboardBg },
  flex: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.md },
  chatContent: { padding: spacing.lg, paddingBottom: spacing.md, gap: 12, flexGrow: 1 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  dashboardLabel: { color: colors.muted, fontSize: 14, fontWeight: "500" },
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
  premiumBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    padding: spacing.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.pinkMuted,
  },
  premiumNote: { color: colors.pink, fontSize: 12, fontWeight: "600", flex: 1 },
  topicCard: {
    backgroundColor: colors.dashboardCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  topicHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  topicIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  topicTitle: { flex: 1, color: colors.ink, fontWeight: "700", fontSize: 16 },
  promptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.mutedDark,
  },
  promptName: { color: colors.ink, fontWeight: "600", fontSize: 14 },
  promptMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  emptyWrap: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: "center" },
  bubble: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: 8,
  },
  userBubble: {
    backgroundColor: colors.pinkMuted,
    marginLeft: 24,
    borderWidth: 1,
    borderColor: "rgba(255,78,173,0.2)",
  },
  coachBubble: {
    backgroundColor: colors.dashboardCard,
    marginRight: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  coachDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  bubbleLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 22, color: colors.ink },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.bgElevated,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.dashboardCard,
  },
  sendBtn: {
    borderRadius: radius.md,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
