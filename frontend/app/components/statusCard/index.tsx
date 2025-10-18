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
      colors={[
        theme.colors.card.background.default,
        theme.colors.card.background.secondary,
      ]}
      style={styles.container}
    >
      <View style={styles.textContainer}>
        <Text
          style={[
            {
              ...theme.typography.heading.xxs,
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
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5, 
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
