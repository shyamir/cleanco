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
import { useTheme } from "@/theme/useTheme";
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
};

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  icon,
  children,
  expanded,
  onToggle,
}) => {
  const theme = useTheme();

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <Base
      style={[
        {
          borderWidth: 1, 
          borderColor: expanded
            ? theme.colors.system.border.active
            : theme.colors.system.background.secondary,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleToggle}
        style={styles.touchable}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
            <Text
              style={[
                theme.typography.body.md.medium,
                { color: theme.colors.system.heading.active },
              ]}
            >
              {title}
            </Text>
          </View>
        </View>
        {expanded && <View style={styles.content}>{children}</View>}
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
  },
  content: {
    marginTop: 12,
  },
});

export default CollapsibleCard;
