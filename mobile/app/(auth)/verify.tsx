import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { clerkEnabled } from "../../lib/auth";
import { colors, spacing } from "../../lib/theme";

export default function VerifyScreen() {
  if (!clerkEnabled) return <DemoRedirect />;
  return <VerifyForm />;
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

function VerifyForm() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleVerify() {
    if (!isLoaded) return;
    setLoading(true);
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/paywall?welcome=1");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.subtitle}>Enter the code sent to your email</Text>

      <TextInput
        style={styles.input}
        placeholder="Verification code"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleVerify} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    padding: spacing.lg,
    justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "800", color: colors.ink },
  subtitle: { color: colors.muted, marginTop: 4, marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.moss,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  error: { color: colors.coral, fontSize: 14, marginBottom: spacing.md },
});
