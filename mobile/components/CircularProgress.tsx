import Svg, { Circle, G } from "react-native-svg";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../lib/theme";

type Props = {
  size?: number;
  strokeWidth?: number;
  progress: number;
  color?: string;
  label?: string;
  sublabel?: string;
};

export function CircularProgress({
  size = 80,
  strokeWidth = 6,
  progress,
  color = colors.mint,
  label,
  sublabel,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, progress));
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
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
      {label != null && label !== "" && (
        <View style={styles.center}>
          <Text style={[styles.label, { color }]}>{label}</Text>
          {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center" },
  label: { fontSize: 22, fontWeight: "800" },
  sublabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
});
