import { useTheme } from "@/theme/ThemeProvider";
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
  disabled?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

const ToggleButton: React.FC<ToggleButtonProps> = ({
  label,
  icon,
  selected,
  disabled,
  onPress,
  style,
}) => {
  const {theme} = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.toggle.background.default;
    if (selected) return theme.colors.toggle.background.active;
    return theme.colors.toggle.background.default;
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.system.body.disabled;
    if (selected) return theme.colors.toggle.label.active;
    return theme.colors.toggle.label.default;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        style,
        { backgroundColor: getBackgroundColor() },
        disabled && { opacity: 0.5 },
      ]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.8}
      disabled={disabled}
    >
      {icon &&
        React.cloneElement(icon as React.ReactElement<any>, {
          color: getTextColor(),
        })}
      <Text
        style={[
          styles.text,
          selected && !disabled
            ? ([
                theme.typography.body.md.medium,
                { color: getTextColor() },
              ] as any)
            : ([
                theme.typography.body.md.regular,
                { color: getTextColor() },
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
