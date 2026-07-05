import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../lib/theme";

export function AuthLoadingScreen({ message = "Loading…" }: { message?: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>PU</Text>
      </View>
      <ActivityIndicator color={colors.lime} size="large" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dashboardBg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#000", fontSize: 28, fontWeight: "800" },
  message: { color: colors.muted, fontSize: 14 },
});
