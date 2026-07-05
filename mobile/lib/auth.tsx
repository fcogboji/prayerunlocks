import {
  ClerkProvider,
  useAuth as useClerkAuth,
  useClerk,
  useUser as useClerkUser,
} from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import Constants from "expo-constants";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { ConfigRequiredScreen } from "../components/ConfigRequiredScreen";

export const publishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  Constants.expoConfig?.extra?.clerkPublishableKey ??
  "";

const PLACEHOLDER_PATTERNS = [
  "your_key_here",
  "pk_test_...",
  "pk_live_...",
  "pk_test_xxx",
  "pk_test_replace",
  "REPLACE_ME",
];

export function isClerkConfigured(key: string): boolean {
  if (!key || key.length < 20) return false;
  if (!key.startsWith("pk_test_") && !key.startsWith("pk_live_")) return false;
  return !PLACEHOLDER_PATTERNS.some((p) => key.includes(p));
}

export const clerkEnabled = isClerkConfigured(publishableKey);

type AuthValue = {
  getToken: () => Promise<string | null>;
  isSignedIn: boolean;
  isLoaded: boolean;
  signOut: () => Promise<void>;
};

type UserValue = {
  user: {
    firstName: string | null;
    fullName: string | null;
    imageUrl: string | null;
  } | null;
};

const AuthContext = createContext<AuthValue | null>(null);
const UserContext = createContext<UserValue | null>(null);

const DEMO_AUTH: AuthValue = {
  getToken: async () => null,
  isSignedIn: true,
  isLoaded: true,
  signOut: async () => {},
};

const DEMO_USER: UserValue = {
  user: {
    firstName: "Daniel",
    fullName: "Daniel",
    imageUrl: null,
  },
};

function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const auth = useClerkAuth();
  const { signOut: clerkSignOut } = useClerk();
  const { user } = useClerkUser();

  const authValue = useMemo<AuthValue>(
    () => ({
      getToken: auth.getToken,
      isSignedIn: auth.isSignedIn ?? false,
      isLoaded: auth.isLoaded ?? false,
      signOut: async () => {
        await clerkSignOut();
      },
    }),
    [auth.getToken, auth.isSignedIn, auth.isLoaded, clerkSignOut],
  );

  const userValue = useMemo<UserValue>(
    () => ({
      user: user
        ? {
            firstName: user.firstName,
            fullName: user.fullName,
            imageUrl: user.imageUrl,
          }
        : null,
    }),
    [user],
  );

  return (
    <AuthContext.Provider value={authValue}>
      <UserContext.Provider value={userValue}>{children}</UserContext.Provider>
    </AuthContext.Provider>
  );
}

function DemoAuthBridge({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={DEMO_AUTH}>
      <UserContext.Provider value={DEMO_USER}>{children}</UserContext.Provider>
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (clerkEnabled) {
    return (
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ClerkAuthBridge>{children}</ClerkAuthBridge>
      </ClerkProvider>
    );
  }

  if (__DEV__) {
    console.warn(
      "Clerk not configured — running in demo mode. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in mobile/.env",
    );
    return <DemoAuthBridge>{children}</DemoAuthBridge>;
  }

  return <ConfigRequiredScreen />;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useUser(): UserValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within AuthProvider");
  return ctx;
}
