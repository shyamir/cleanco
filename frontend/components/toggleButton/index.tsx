import { useTheme } from "@/theme/useTheme";
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  View,
} from "react-native";

type ToggleButtonProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

const ToggleButton: React.FC<ToggleButtonProps> = ({
  label,
  icon,
  selected,
  onPress,
  style,
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        style, 
        selected
          ? ({
              backgroundColor: theme.colors.toggle.background.active,
            } as any)
          : ({
              backgroundColor: theme.colors.toggle.background.default,
            } as any),
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon &&
        React.cloneElement(icon as React.ReactElement<any>, {
          color: selected
            ? theme.colors.toggle.label.active
            : theme.colors.toggle.label.default,
        })}
      <Text
        style={[
          styles.text,
          selected
            ? ([
                theme.typography.body.md.medium,
                {
                  color: theme.colors.toggle.label.active,
                },
              ] as any)
            : ([
                theme.typography.body.md.regular,
                {
                  color: theme.colors.toggle.label.default,
                },
              ] as any),
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 24,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginVertical: 6,
    flex: 1,
    height: 40,
  },
  icon: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
  },
});

export default ToggleButton;
