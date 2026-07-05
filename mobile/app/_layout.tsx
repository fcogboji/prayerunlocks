import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { AuthLoadingScreen } from "../components/AuthLoadingScreen";
import { AuthProvider, clerkEnabled, useAuth } from "../lib/auth";
import { acceptPendingInvites } from "../lib/invite";
import { registerForPushNotifications } from "../lib/notifications";
import { setUnauthorizedHandler } from "../lib/api";
import { SubscriptionProvider, useSubscription } from "../lib/subscription";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { isLoaded: subscriptionLoaded } = useSubscription();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!clerkEnabled) return;

    setUnauthorizedHandler(() => {
      signOut().finally(() => {
        router.replace("/(auth)/sign-in");
      });
    });

    return () => setUnauthorizedHandler(null);
  }, [signOut, router]);

  useEffect(() => {
    if (!clerkEnabled) return;
    if (!isLoaded) return;

    const root = segments[0];
    const inAuth = root === "(auth)";
    const inJoin = root === "join";
    const inPaywall = root === "paywall";
    const onVerify = inAuth && (segments as string[]).includes("verify");

    if (!isSignedIn && !inAuth && !inJoin) {
      router.replace("/(auth)/sign-in");
      return;
    }

    if (isSignedIn && inAuth && !onVerify) {
      router.replace("/(tabs)");
    }

    if (isSignedIn && !inAuth && !inJoin && !inPaywall && root === "(tabs)") {
      /* main app — freemium, no hard paywall gate */
    }
  }, [isLoaded, isSignedIn, segments, router]);

  useEffect(() => {
    if (!clerkEnabled || !isLoaded || !isSignedIn) return;

    acceptPendingInvites(getToken).then(() => {
      /* invite accepted silently on launch */
    });

    registerForPushNotifications(getToken).catch(() => {
      /* push optional in dev */
    });
  }, [isLoaded, isSignedIn, getToken]);

  const showLoading =
    clerkEnabled && (!isLoaded || (isSignedIn && !subscriptionLoaded));

  return (
    <View style={{ flex: 1 }}>
      {children}
      {showLoading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <AuthLoadingScreen
            message={
              !isLoaded ? "Checking your session…" : "Loading your account…"
            }
          />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <AuthGuard>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="paywall" />
            <Stack.Screen name="join" />
            <Stack.Screen name="group" />
          </Stack>
        </AuthGuard>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
