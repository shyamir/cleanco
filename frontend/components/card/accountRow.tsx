import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Icon } from "@/constants/icon";
import Base from "./base";

type AccountRowProps = {
  icon?: React.ReactNode; // Left icon
  title: string; // Main label
  subtitle?: string; // Secondary text
  onPress?: () => void; // Navigation action
  style?: any;
};

const AccountRow: React.FC<AccountRowProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Base style={[styles.rowContainer, style]}>
        {/* Left Icon */}
        {icon && <View style={styles.icon}>{icon}</View>}

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text
            style={[
              theme.typography.body.md.regular,
              { color: theme.colors.system.body.default },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                theme.typography.body.sm.regular,
                { color: theme.colors.system.body.secondary },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Arrow */}
        <Icon.chevron color={theme.colors.system.body.secondary} />
      </Base>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    flexDirection: "column",
    gap: 4,
  },
});

export default AccountRow;
