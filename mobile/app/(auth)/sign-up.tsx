import { useSignUp } from "@clerk/clerk-expo";
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

export default function SignUpScreen() {
  if (!clerkEnabled) return <DemoRedirect />;
  return <SignUpForm />;
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

function SignUpForm() {
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignUp() {
    if (!isLoaded) return;
    setLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(" ")[0],
        lastName: name.split(" ").slice(1).join(" ") || undefined,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      router.push("/(auth)/verify");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign up failed");
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
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start your daily walk with God</Text>
        </View>

        <SocialAuthButtons mode="sign-up" />

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.mutedDark}
            value={name}
            onChangeText={setName}
          />
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
          <Pressable style={styles.button} onPress={handleSignUp} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Sign up with email</Text>
            )}
          </Pressable>
        </View>

        <Link href="/(auth)/sign-in" asChild>
          <Pressable>
            <Text style={styles.link}>Already have an account? Sign in</Text>
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
  brand: { marginBottom: spacing.xl },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink },
  subtitle: { color: colors.muted, marginTop: 4 },
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
