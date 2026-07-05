import { useSSO } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { OAuthStrategy } from "@clerk/types";
import { colors, radius, spacing } from "../lib/theme";

if (Platform.OS !== "web") {
  WebBrowser.maybeCompleteAuthSession();
}

type Provider = {
  strategy: OAuthStrategy;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const PROVIDERS: Provider[] = [
  { strategy: "oauth_google", label: "Google", icon: "logo-google" },
  { strategy: "oauth_apple", label: "Apple", icon: "logo-apple" },
  { strategy: "oauth_github", label: "GitHub", icon: "logo-github" },
];

type SocialAuthButtonsProps = {
  mode: "sign-in" | "sign-up";
};

export function SocialAuthButtons({ mode }: SocialAuthButtonsProps) {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (Platform.OS === "web") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleOAuth = useCallback(
    async (strategy: OAuthStrategy, label: string) => {
      setLoadingProvider(label);
      setError("");

      try {
        const redirectUrl = AuthSession.makeRedirectUri({
          scheme: "prayerunlocks",
          path: "oauth-native-callback",
        });

        const { createdSessionId, setActive, signUp } = await startSSOFlow({
          strategy,
          redirectUrl,
        });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });

          const isNewUser = Boolean(signUp?.id);
          if (mode === "sign-up" || isNewUser) {
            router.replace("/paywall?welcome=1");
          } else {
            router.replace("/(tabs)");
          }
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Sign in failed";
        if (!message.toLowerCase().includes("cancel")) {
          setError(message);
        }
      } finally {
        setLoadingProvider(null);
      }
    },
    [mode, router, startSSOFlow],
  );

  const visibleProviders = PROVIDERS;

  return (
    <View style={styles.wrap}>
      <View style={styles.buttons}>
        {visibleProviders.map((provider) => {
          const busy = loadingProvider === provider.label;
          return (
            <Pressable
              key={provider.strategy}
              style={({ pressed }) => [
                styles.socialBtn,
                pressed && styles.socialBtnPressed,
                busy && styles.socialBtnBusy,
              ]}
              onPress={() => handleOAuth(provider.strategy, provider.label)}
              disabled={loadingProvider !== null}
            >
              {busy ? (
                <ActivityIndicator color={colors.ink} size="small" />
              ) : (
                <Ionicons name={provider.icon} size={20} color={colors.ink} />
              )}
              <Text style={styles.socialLabel}>
                {mode === "sign-up" ? "Sign up" : "Continue"} with {provider.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or use email</Text>
        <View style={styles.dividerLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  buttons: { gap: spacing.sm },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.dashboardCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  socialBtnPressed: { opacity: 0.85 },
  socialBtnBusy: { opacity: 0.7 },
  socialLabel: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  error: { color: colors.coral, fontSize: 13, marginTop: spacing.sm, textAlign: "center" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.cardBorder },
  dividerText: { color: colors.muted, fontSize: 12, fontWeight: "500" },
});
