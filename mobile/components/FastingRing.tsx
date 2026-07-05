import Svg, { Circle, G } from "react-native-svg";
import { View, Text, StyleSheet, type ReactNode } from "react-native";
import { colors } from "../lib/theme";

type Props = {
  size?: number;
  strokeWidth?: number;
  progress: number;
  color?: string;
  children?: ReactNode;
};

export function FastingRing({
  size = 260,
  strokeWidth = 10,
  progress,
  color = colors.lime,
  children,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, progress));
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <G transform={`rotate(-90, ${center}, ${center})`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
});
