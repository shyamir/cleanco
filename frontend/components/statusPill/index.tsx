import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type StatusPillProps = {
  status: "upcoming" | "completed" | "cancelled" | "pending";
};

const getStatusStyle = (theme: any, status: string) => {
  const s = status.toLowerCase();

  switch (s) {
    case "completed":
      return {
        bg: theme.colors.pill.background.success,
        text: theme.colors.pill.label.success,
        border: theme.colors.pill.border.success,
      };

    case "cancelled":
      return {
        bg: theme.colors.pill.background.error,
        text: theme.colors.pill.label.error,
        border: theme.colors.pill.border.error,
      };

    case "pending":
      return {
        bg: theme.colors.pill.background.warning,
        text: theme.colors.pill.label.warning,
        border: theme.colors.pill.border.warning,
      };

    case "upcoming":
    default:
      return {
        bg: theme.colors.pill.background.default,
        text: theme.colors.pill.label.default,
        border: theme.colors.pill.border.default,
      };
  }
};

const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const {theme} = useTheme();
  const styles = getStatusStyle(theme, status);

  return (
    <View
      style={[s.pill, { backgroundColor: styles.bg, borderColor: styles.border }]}
    >
      <Text style={[theme.typography.body.md.regular, { color: styles.text }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
};

const s = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
        borderRadius: 20,
    // borderWidth: 1,
    alignSelf: "flex-start",
  },
});

export default StatusPill;
