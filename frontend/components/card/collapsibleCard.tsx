import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import Base from "./base";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CollapsibleCardProps = {
  title: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
  badge?: string;
};

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  icon,
  children,
  expanded,
  onToggle,
  disabled = false,
  badge,
}) => {
  const { theme } = useTheme();

  const handleToggle = () => {
    if (disabled) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <Base
      style={[
        {
          shadowOpacity: disabled ? 0.05 : 0.15,
          borderWidth: 2,
          borderColor: expanded
            ? theme.colors.system.border.active
            : theme.colors.system.background.secondary,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={disabled ? 1 : 0.9}
        onPress={handleToggle}
        style={styles.touchable}
        disabled={disabled}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {icon && <View>{icon}</View>}
            <Text
              style={[
                theme.typography.body.md.medium,
                {
                  color: disabled
                    ? theme.colors.system.body.disabled
                    : theme.colors.system.body.tertiary,
                },
              ]}
            >
              {title}
            </Text>
          </View>
          {badge && (
            <View
              style={[
                styles.badge,
                { backgroundColor: theme.colors.system.background.tertiary },
              ]}
            >
              <Text
                style={[
                  theme.typography.body.xs.medium,
                  { color: theme.colors.system.body.disabled },
                ]}
              >
                {badge}
              </Text>
            </View>
          )}
        </View>
        {expanded && !disabled && <View style={styles.content}>{children}</View>}
      </TouchableOpacity>
    </Base>
  );
};

const styles = StyleSheet.create({
  touchable: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  content: {
    marginTop: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

export default CollapsibleCard;
