import { useTheme } from "@/theme/useTheme";
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

type ToggleButtonProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

const ToggleButton: React.FC<ToggleButtonProps> = ({
  label,
  selected,
  onPress,
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
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
      <Text
        style={[
          styles.text,
          selected
            ? ([
                theme.typography.body.sm.medium,
                {
                  color: theme.colors.toggle.label.active,
                },
              ] as any)
            : ([
                theme.typography.body.sm.regular,
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
    marginVertical: 6,
    flex: 1,
    height: 40,
  },
  selectedButton: {
    backgroundColor: "#E8F0FF",
  },
  unselectedButton: {
    backgroundColor: "#F4F4F4",
  },
  selectedText: {
    color: "#0025A5",
    fontWeight: "600",
  },
  unselectedText: {
    color: "#555",
  },
  text: {
    fontSize: 16,
  },
});

export default ToggleButton;
