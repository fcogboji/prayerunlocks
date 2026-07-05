import { useAuth } from "../../lib/auth";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  createApiClient,
  openPremiumCheckout,
  type ActivityItem,
  type ChurchGroup,
  type Nudge,
  type Partner,
  type PartnersResponse,
} from "../../lib/api";
import { colors, radius, spacing } from "../../lib/theme";
import { allowDemoData } from "../../lib/dev";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function CommunityScreen() {
  const { getToken } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [maxPartners, setMaxPartners] = useState(1);
  const [tier, setTier] = useState<"FREE" | "PREMIUM">("FREE");
  const [codeInput, setCodeInput] = useState("");
  const [groups, setGroups] = useState<ChurchGroup[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupJoinCode, setGroupJoinCode] = useState("");

  const load = useCallback(async () => {
    try {
      const api = createApiClient(getToken);
      const [partnersRes, groupsRes] = await Promise.all([
        api.get<PartnersResponse>("/api/partners"),
        api.get<{ groups: ChurchGroup[] }>("/api/groups"),
      ]);
      setPartners(partnersRes.data.partners);
      setNudges(partnersRes.data.unreadNudges);
      setActivity(partnersRes.data.activity);
      setInviteUrl(partnersRes.data.inviteUrl);
      setInviteCode(partnersRes.data.inviteCode);
      setMaxPartners(partnersRes.data.maxPartners);
      setTier(partnersRes.data.tier);
      setGroups(groupsRes.data.groups);
    } catch {
      if (!allowDemoData) return;
      setGroups([
        {
          id: "demo-group",
          name: "Sunday Cell Group",
          churchName: "Grace Community",
          inviteCode: "DEMO-GROUP",
          role: "LEADER",
          memberCount: 6,
          leaderName: "You",
        },
      ]);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function copyInvite() {
    await Clipboard.setStringAsync(inviteUrl || "https://steadfast.app/join/demo");
    Alert.alert("Copied!", "Invite link copied to clipboard.");
  }

  async function addPartner() {
    if (!codeInput.trim()) return;
    if (tier === "FREE" && partners.length >= maxPartners) {
      Alert.alert(
        "Partner limit reached",
        "Free plan includes 1 partner. Upgrade to Premium for unlimited partners.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Upgrade", onPress: () => openPremiumCheckout(getToken) },
        ],
      );
      return;
    }
    try {
      const api = createApiClient(getToken);
      await api.post("/api/partners", { inviteCode: codeInput.trim() });
      setCodeInput("");
      await load();
      Alert.alert("Success", "Partner added!");
    } catch {
      Alert.alert("Error", "Could not add partner. Check the invite code.");
    }
  }

  async function nudge(partnerId: string, name: string, type: "PRAYED_FOR_YOU" | "CHECK_IN") {
    const messages = {
      PRAYED_FOR_YOU: "I prayed for you 🙏",
      CHECK_IN: "Have you prayed today?",
    };
    try {
      const api = createApiClient(getToken);
      await api.put("/api/partners", { partnerId, type, message: messages[type] });
      Alert.alert("Sent!", `Message sent to ${name}`);
      await load();
    } catch {
      Alert.alert("Sent!", `Message sent to ${name}`);
    }
  }

  async function dismissNudge(id: string) {
    try {
      const api = createApiClient(getToken);
      await api.patch("/api/partners", { nudgeId: id });
      setNudges((prev) => prev.filter((n) => n.id !== id));
    } catch {
      setNudges((prev) => prev.filter((n) => n.id !== id));
    }
  }

  async function createGroup() {
    if (!groupName.trim()) return;
    try {
      const api = createApiClient(getToken);
      await api.post("/api/groups", { name: groupName.trim() });
      setGroupName("");
      await load();
      Alert.alert("Group created", "Share the invite code with your church members.");
    } catch {
      Alert.alert("Error", "Could not create group. Free plan allows 1 group.");
    }
  }

  async function joinGroup() {
    if (!groupJoinCode.trim()) return;
    try {
      const api = createApiClient(getToken);
      const res = await api.put("/api/groups", { inviteCode: groupJoinCode.trim() });
      setGroupJoinCode("");
      await load();
      Alert.alert("Welcome", res.data.message ?? "Joined group");
    } catch {
      Alert.alert("Error", "Invalid group code");
    }
  }

  async function copyGroupCode(code: string) {
    await Clipboard.setStringAsync(code);
    Alert.alert("Copied!", "Group invite code copied.");
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Accountability that actually keeps you going</Text>

        <Text style={styles.sectionLabel}>CHURCH GROUPS</Text>
        <Text style={styles.sectionHint}>
          Tap a group for the leader dashboard · long-press to copy code
        </Text>
        {groups.map((g) => (
          <Pressable
            key={g.id}
            style={styles.groupCard}
            onPress={() => router.push(`/group/${g.id}`)}
            onLongPress={() => copyGroupCode(g.inviteCode)}
          >
            <View style={styles.groupIcon}>
              <Ionicons name="business-outline" size={18} color={colors.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.groupName}>{g.name}</Text>
              <Text style={styles.groupMeta}>
                {g.memberCount} members · {g.role === "LEADER" ? "You lead" : g.leaderName}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}

        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="New group name"
            placeholderTextColor={colors.mutedDark}
            value={groupName}
            onChangeText={setGroupName}
          />
          <Pressable style={styles.addBtn} onPress={createGroup}>
            <Text style={styles.addBtnText}>Create</Text>
          </Pressable>
        </View>

        <View style={[styles.addRow, { marginBottom: spacing.lg }]}>
          <TextInput
            style={styles.input}
            placeholder="Join group code"
            placeholderTextColor={colors.mutedDark}
            value={groupJoinCode}
            onChangeText={setGroupJoinCode}
          />
          <Pressable style={[styles.addBtn, { backgroundColor: colors.purple }]} onPress={joinGroup}>
            <Text style={styles.addBtnText}>Join</Text>
          </Pressable>
        </View>

        {nudges.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>ENCOURAGEMENT FOR YOU</Text>
            {nudges.map((n) => (
              <View key={n.id} style={styles.nudgeCard}>
                <Ionicons name="heart" size={18} color={colors.pink} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.nudgeFrom}>
                    {n.fromUser.name ?? "Your partner"}
                  </Text>
                  <Text style={styles.nudgeMsg}>{n.message ?? "Sent encouragement"}</Text>
                </View>
                <Pressable onPress={() => dismissNudge(n.id)}>
                  <Ionicons name="checkmark-circle-outline" size={22} color={colors.lime} />
                </Pressable>
              </View>
            ))}
          </>
        )}

        <Pressable style={styles.inviteCard} onPress={copyInvite}>
          <Ionicons name="link-outline" size={22} color={colors.lime} />
          <View style={{ flex: 1 }}>
            <Text style={styles.inviteTitle}>Invite a partner</Text>
            <Text style={styles.inviteSub}>
              {tier === "FREE"
                ? `${partners.length}/${maxPartners} partner on free plan`
                : "Unlimited partners on Premium"}
            </Text>
          </View>
          <Ionicons name="copy-outline" size={18} color={colors.muted} />
        </Pressable>

        <Text style={styles.sectionLabel}>YOUR PARTNERS</Text>

        {partners.map((p) => (
          <View key={p.id} style={styles.partnerCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{p.name[0]}</Text>
            </View>
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerName}>{p.name}</Text>
              <Text style={styles.partnerMeta}>{p.todayCompleted}/5 habits today</Text>
            </View>
            <View style={styles.nudgeActions}>
              <Pressable
                style={styles.iconBtn}
                onPress={() => nudge(p.id, p.name, "PRAYED_FOR_YOU")}
              >
                <Ionicons name="heart" size={16} color={colors.pink} />
              </Pressable>
              <Pressable
                style={styles.iconBtn}
                onPress={() => nudge(p.id, p.name, "CHECK_IN")}
              >
                <Ionicons name="chatbubble-outline" size={16} color={colors.lime} />
              </Pressable>
            </View>
          </View>
        ))}

        {partners.length === 0 && (
          <Text style={styles.empty}>No partners yet. Share your invite link to start.</Text>
        )}

        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter invite code"
            placeholderTextColor={colors.mutedDark}
            value={codeInput}
            onChangeText={setCodeInput}
          />
          <Pressable style={styles.addBtn} onPress={addPartner}>
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        {inviteCode ? (
          <Text style={styles.codeLabel}>
            Your code: <Text style={styles.code}>{inviteCode}</Text>
          </Text>
        ) : null}

        {activity.length > 0 && (
          <View style={styles.feedCard}>
            <Text style={styles.feedTitle}>Recent activity</Text>
            {activity.map((item) => (
              <View key={item.id} style={styles.feedItem}>
                <View
                  style={[
                    styles.feedDot,
                    {
                      backgroundColor:
                        item.type === "nudge" ? colors.pink : colors.lime,
                    },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.feedName}>{item.name}</Text>
                  <Text style={styles.feedMsg}>{item.message}</Text>
                </View>
                <Text style={styles.feedTime}>{timeAgo(item.createdAt)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 120 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 14, marginBottom: spacing.lg },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionHint: {
    color: colors.mutedDark,
    fontSize: 12,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  nudgeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.pinkMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,78,173,0.2)",
  },
  nudgeFrom: { color: colors.ink, fontWeight: "700", fontSize: 14 },
  nudgeMsg: { color: colors.muted, fontSize: 12, marginTop: 2 },
  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  inviteTitle: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  inviteSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  partnerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.purpleMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.purple, fontWeight: "800", fontSize: 18 },
  partnerInfo: { flex: 1 },
  partnerName: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  partnerMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  nudgeActions: { flexDirection: "row", gap: 6 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { color: colors.muted, marginBottom: spacing.lg },
  addRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    color: colors.ink,
    fontSize: 15,
  },
  addBtn: {
    backgroundColor: colors.lime,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  addBtnText: { color: colors.bg, fontWeight: "700" },
  codeLabel: { color: colors.muted, fontSize: 13, marginTop: spacing.md },
  code: { color: colors.lime, fontWeight: "700" },
  feedCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  feedTitle: { color: colors.ink, fontWeight: "700", fontSize: 16, marginBottom: spacing.md },
  feedItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  feedDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  feedName: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  feedMsg: { color: colors.muted, fontSize: 12, marginTop: 2 },
  feedTime: { color: colors.mutedDark, fontSize: 10 },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.purpleMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  groupName: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  groupMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  groupCode: { color: colors.lime, fontSize: 11, fontWeight: "700" },
});
