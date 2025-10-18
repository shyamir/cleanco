import { useTheme } from "@/theme/useTheme";
import MaskedView from "@react-native-masked-view/masked-view";
import React from "react";
import { Text, TextStyle } from "react-native";
import LinearGradient from "react-native-linear-gradient";

type GradientTextProps = {
  text: string;
  colors: string[]; // gradient colors
  style?: TextStyle; // optional extra styling
  variant?: TextStyle; // pass a theme typography style
  start?: { x: number; y: number };
  end?: { x: number; y: number };
};

export default function GradientText({
  text,
  colors,
  style,
  variant,
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
}: GradientTextProps) {
  const theme = useTheme();

  // fallback to heading.lg if no variant is provided
  const textStyle = variant ?? theme.typography.heading.lg;

  return (
    <MaskedView
      maskElement={
        <Text style={[textStyle, style, { backgroundColor: "transparent" }]}>
          {text}
        </Text>
      }
    >
      <LinearGradient colors={colors} start={start} end={end}>
        <Text style={[textStyle, style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}
