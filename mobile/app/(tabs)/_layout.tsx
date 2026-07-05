import { Tabs } from "expo-router";
import { colors } from "../../lib/theme";
import { CustomTabBar } from "../../components/CustomTabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bgElevated },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Unlock" }} />
      <Tabs.Screen name="fasting" options={{ title: "Fast" }} />
      <Tabs.Screen name="community" options={{ title: "Community" }} />
      <Tabs.Screen name="insights" options={{ title: "Streaks" }} />
      <Tabs.Screen name="coach" options={{ title: "AI Coach" }} />
      <Tabs.Screen name="profile" options={{ title: "You" }} />
      <Tabs.Screen name="add" options={{ href: null, title: "Add" }} />
      <Tabs.Screen name="habits" options={{ href: null, title: "Habits" }} />
      <Tabs.Screen name="partners" options={{ href: null }} />
    </Tabs>
  );
}
