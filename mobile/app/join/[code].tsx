import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { savePartnerInvite } from "../../lib/invite";
import { colors, spacing } from "../../lib/theme";

export default function JoinPartnerScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!code) return;
    async function run() {
      await savePartnerInvite(String(code));
      router.replace("/(auth)/sign-up");
    }
    run();
  }, [code, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.lime} />
      <Text style={styles.text}>Setting up your partner invite…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  text: { color: colors.muted, fontSize: 14 },
});
