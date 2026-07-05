import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "../lib/theme";

type TabItemProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
};

function TabItem({ label, icon, activeIcon, active, onPress }: TabItemProps) {
  return (
    <Pressable style={styles.tab} onPress={onPress}>
      <Ionicons
        name={active ? activeIcon : icon}
        size={20}
        color={active ? colors.lime : colors.muted}
      />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index]?.name ?? "index";

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <Pressable style={styles.newHabitBtn} onPress={() => navigation.navigate("index")}>
        <Ionicons name="lock-open-outline" size={18} color={colors.bg} />
        <Text style={styles.newHabitText}>Unlock</Text>
      </Pressable>

      <View style={styles.iconGroup}>
        <TabItem
          label="Unlock"
          icon="lock-open-outline"
          activeIcon="lock-open"
          active={activeRoute === "index"}
          onPress={() => navigation.navigate("index")}
        />
        <TabItem
          label="Fast"
          icon="timer-outline"
          activeIcon="timer"
          active={activeRoute === "fasting"}
          onPress={() => navigation.navigate("fasting")}
        />
        <TabItem
          label="Community"
          icon="people-outline"
          activeIcon="people"
          active={activeRoute === "community"}
          onPress={() => navigation.navigate("community")}
        />
        <TabItem
          label="Streaks"
          icon="grid-outline"
          activeIcon="grid"
          active={activeRoute === "insights"}
          onPress={() => navigation.navigate("insights")}
        />
        <TabItem
          label="Coach"
          icon="sparkles-outline"
          activeIcon="sparkles"
          active={activeRoute === "coach"}
          onPress={() => navigation.navigate("coach")}
        />
        <TabItem
          label="You"
          icon="person-outline"
          activeIcon="person"
          active={activeRoute === "profile"}
          onPress={() => navigation.navigate("profile")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 8,
  },
  newHabitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  newHabitText: {
    color: colors.bg,
    fontSize: 12,
    fontWeight: "800",
  },
  iconGroup: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tab: {
    alignItems: "center",
    gap: 3,
    paddingBottom: 2,
    minWidth: 44,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.muted,
  },
  tabLabelActive: {
    color: colors.lime,
  },
});
