import { useTheme } from "@/theme/useTheme";
import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";

type ToggleButtonProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle; // ✅ already good
};

const ToggleButton: React.FC<ToggleButtonProps> = ({
  label,
  selected,
  onPress,
  style, // ✅ make sure to include this here
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        style, // ✅ this lets external styles (like height: 86) apply
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
    marginVertical: 6,
    flex: 1,
    height: 40, // default height
  },
  text: {
    fontSize: 16,
  },
});

export default ToggleButton;
