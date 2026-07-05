import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../lib/theme";

export function ConfigRequiredScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Configuration required</Text>
      <Text style={styles.body}>
        This build is missing authentication settings. Set
        EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY and EXPO_PUBLIC_API_URL before
        releasing to users.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: spacing.md,
    textAlign: "center",
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
