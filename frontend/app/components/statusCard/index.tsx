import { useTheme } from "@/theme/useTheme";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";

type Props = {
  title: string;
  description: string;
};

export const StatusCard: React.FC<Props> = ({ title, description }) => {
  const theme = useTheme();

  return (
    <LinearGradient
      colors={theme.colors.card.background.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.textContainer}>
        <Text
          style={[
            {
              ...theme.typography.heading.xs2,
              color: theme.colors.card.label.default,
            } as any,
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            {
              ...theme.typography.body.md,
              color: theme.colors.card.label.secondary,
            } as any,
            styles.text,
          ]}
        >
          {description}
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    height: "70%",
  },
  textContainer: {
    alignItems: "center",
    gap: 12,
    marginHorizontal: 46,
  },
  text: {
    textAlign: "center",
  },
});
