import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import { useAuth } from "./auth";
import {
  createApiClient,
  fetchUserProfile,
  type UserProfile,
} from "./api";

type Tier = "FREE" | "PREMIUM";

type SubscriptionValue = {
  tier: Tier;
  isPremium: boolean;
  isLoaded: boolean;
  profile: UserProfile | null;
  refresh: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded: authLoaded, getToken } = useAuth();
  const [tier, setTier] = useState<Tier>("FREE");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setTier("FREE");
      setProfile(null);
      setLoaded(true);
      return;
    }

    try {
      const api = createApiClient(getToken);
      const user = await fetchUserProfile(api);
      setProfile(user);
      setTier(user.tier === "PREMIUM" ? "PREMIUM" : "FREE");
    } catch {
      setTier("FREE");
    } finally {
      setLoaded(true);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (!authLoaded) return;
    setLoaded(false);
    refresh();
  }, [authLoaded, isSignedIn, refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && isSignedIn) {
        refresh();
      }
    });
    return () => sub.remove();
  }, [isSignedIn, refresh]);

  const value = useMemo<SubscriptionValue>(
    () => ({
      tier,
      isPremium: tier === "PREMIUM",
      isLoaded: !isSignedIn || loaded,
      profile,
      refresh,
    }),
    [tier, loaded, profile, refresh, isSignedIn],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}
