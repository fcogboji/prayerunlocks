import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "PrayerUnlocks",
  slug: "prayerunlocks",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  scheme: "prayerunlocks",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#121212",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.prayerunlocks.app",
    associatedDomains: ["applinks:prayerunlocks.com"],
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#121212",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    package: "com.prayerunlocks.app",
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-dev-client",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#ccff00",
      },
    ],
    "expo-image",
  ],
  experiments: {
    typedRoutes: false,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "https://prayerunlocks.com",
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    },
  },
};

export default config;
