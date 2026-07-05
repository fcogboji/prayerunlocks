import { useAuth } from "../../lib/auth";
import * as Clipboard from "expo-clipboard";
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
import { createApiClient, type Partner } from "../../lib/api";
import { colors, spacing } from "../../lib/theme";

export default function PartnersScreen() {
  const { getToken } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [codeInput, setCodeInput] = useState("");

  const load = useCallback(async () => {
    const api = createApiClient(getToken);
    const res = await api.get<{
      partners: Partner[];
      inviteUrl: string;
      inviteCode: string;
    }>("/api/partners");
    setPartners(res.data.partners);
    setInviteUrl(res.data.inviteUrl);
    setInviteCode(res.data.inviteCode);
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function copyInvite() {
    await Clipboard.setStringAsync(inviteUrl);
    Alert.alert("Copied!", "Invite link copied to clipboard.");
  }

  async function addPartner() {
    if (!codeInput.trim()) return;
    const api = createApiClient(getToken);
    try {
      await api.post("/api/partners", { inviteCode: codeInput.trim() });
      setCodeInput("");
      await load();
      Alert.alert("Success", "Partner added!");
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Could not add partner";
      Alert.alert("Error", msg ?? "Could not add partner");
    }
  }

  async function nudge(partnerId: string, name: string) {
    const api = createApiClient(getToken);
    await api.put("/api/partners", {
      partnerId,
      type: "PRAYED_FOR_YOU",
      message: "I prayed for you 🙏",
    });
    Alert.alert("Sent!", `Encouragement sent to ${name}`);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Accountability</Text>
        <Text style={styles.title}>Walk with people who help you keep going</Text>
        <Pressable style={styles.inviteBtn} onPress={copyInvite}>
          <Text style={styles.inviteBtnText}>Copy Invite Link</Text>
        </Pressable>
      </View>

      <Text style={styles.codeLabel}>
        Your code: <Text style={styles.code}>{inviteCode}</Text>
      </Text>

      {partners.map((p) => (
        <View key={p.id} style={styles.card}>
          <View>
            <Text style={styles.partnerName}>{p.name}</Text>
            <Text style={styles.partnerStatus}>{p.todayCompleted}/4 habits today</Text>
          </View>
          <Pressable style={styles.nudgeBtn} onPress={() => nudge(p.id, p.name)}>
            <Text style={styles.nudgeBtnText}>Nudge</Text>
          </Pressable>
        </View>
      ))}

      {partners.length === 0 && (
        <Text style={styles.empty}>No partners yet. Share your invite link!</Text>
      )}

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter partner invite code"
          value={codeInput}
          onChangeText={setCodeInput}
        />
        <Pressable style={styles.addBtn} onPress={addPartner}>
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { marginBottom: spacing.md },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.sage,
  },
  title: { fontSize: 20, fontWeight: "800", color: colors.ink, marginTop: 4 },
  inviteBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.moss,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: spacing.md,
  },
  inviteBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  codeLabel: { color: colors.muted, fontSize: 14, marginBottom: spacing.md },
  code: { color: colors.ink, fontWeight: "700" },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  partnerName: { fontWeight: "700", color: colors.ink },
  partnerStatus: { fontSize: 13, color: colors.muted, marginTop: 2 },
  nudgeBtn: {
    borderWidth: 1,
    borderColor: colors.moss,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  nudgeBtnText: { color: colors.moss, fontWeight: "600", fontSize: 13 },
  empty: { color: colors.muted, marginBottom: spacing.lg },
  addRow: { flexDirection: "row", gap: 8, marginTop: spacing.md },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.white,
    fontSize: 15,
  },
  addBtn: {
    backgroundColor: colors.moss,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "700" },
});
