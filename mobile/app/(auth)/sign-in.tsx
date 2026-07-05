import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { SocialAuthButtons } from "../../components/SocialAuthButtons";
import { clerkEnabled } from "../../lib/auth";
import { colors, spacing } from "../../lib/theme";

export default function SignInScreen() {
  if (!clerkEnabled) {
    return <DemoRedirect />;
  }
  return <SignInForm />;
}

function DemoRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/(tabs)");
  }, [router]);
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.moss} />
    </View>
  );
}

function SignInForm() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn() {
    if (!isLoaded) return;
    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>PU</Text>
          </View>
          <Text style={styles.title}>PrayerUnlocks</Text>
          <Text style={styles.subtitle}>Pray your way through any situation</Text>
        </View>

        <SocialAuthButtons mode="sign-in" />

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.mutedDark}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.mutedDark}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.button} onPress={handleSignIn} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Sign in with email</Text>
            )}
          </Pressable>
        </View>

        <Link href="/(auth)/sign-up" asChild>
          <Pressable>
            <Text style={styles.link}>Don&apos;t have an account? Sign up</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.dashboardBg },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  brand: { alignItems: "center", marginBottom: spacing.xl },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  logoText: { color: "#000", fontSize: 28, fontWeight: "800" },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink },
  subtitle: { color: colors.muted, marginTop: 4, textAlign: "center" },
  form: { gap: spacing.md, marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.dashboardCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    color: colors.ink,
  },
  button: {
    backgroundColor: colors.lime,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
  },
  buttonText: { color: "#000", fontWeight: "700", fontSize: 16 },
  error: { color: colors.coral, fontSize: 14 },
  link: { textAlign: "center", color: colors.lime, fontWeight: "600" },
});
