import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { createApiClient } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(
  getToken: () => Promise<string | null>,
) {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const pushToken = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "PrayerUnlocks",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const api = createApiClient(getToken);
  await api.patch("/api/user", { pushToken: pushToken.data });

  return pushToken.data;
}
