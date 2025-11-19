import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  View
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "@/theme/useTheme";

type ButtonProps = {
  variant: "filled" | "tonal" | "outline";
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  icon?: React.ReactNode; // optional icon
  iconPosition?: "left" | "right"; // default left
  gradientColors?: string[]; // optional, for filled button
};

const Button: React.FC<ButtonProps> = ({
  variant,
  label,
  onPress,
  style,
  textStyle,
  disabled = false,
  icon,
  iconPosition = "left",
  gradientColors,
}) => {
  const theme = useTheme();

  const getTextColor = () => {
    if (disabled) return theme.colors.button.label.secondary;

    switch (variant) {
      case "filled":
        return theme.colors.button.label.default; // gradient button
      case "tonal":
        return theme.colors.button.label.default; // transparent button
      case "outline":
        return theme.colors.button.label.secondary; // outline button
      default:
        return theme.colors.button.label.default;
    }
  };

  const getTextStyle = () => {
    return variant === "tonal"
      ? theme.typography.body.sm.medium
      : theme.typography.body.md.medium;
  };

  const getBorder = () => {
    if (variant === "outline") {
      return {
        borderWidth: 1,
        borderColor: theme.colors.button.border.default,
      };
    }
    return {};
  };

  const getPaddingVertical = () => {
    switch (variant) {
      case "tonal":
        return 4;
      case "filled":
        return 12;
      case "outline":
        return 12;
      default:
        return 12;
    }
  };

  const content = (
    <View
      style={{
        flexDirection: icon && iconPosition === "left" ? "row" : "row-reverse",
        alignItems: "center",
        gap: 8,
      }}
    >
      {icon && icon}
      <Text style={[{ color: getTextColor(), ...getTextStyle() }, textStyle]}>
        {label}
      </Text>
    </View>
  );

  const buttonStyle: ViewStyle = {
    paddingVertical: getPaddingVertical(),
    paddingHorizontal: 12,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  };

  if (variant === "filled" && !disabled) {
    const gradient = gradientColors || theme.colors.button.background.primary;

    return (
      <LinearGradient
        colors={gradient} // use the passed gradientColors
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[{ borderRadius: 48 }, getBorder(), style]}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {content}
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // Tonal or Outline
  const backgroundColor =
    variant === "tonal"
      ? "rgba(255, 255, 255, 0.2)" // semi-transparent white
      : "transparent";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[buttonStyle, { backgroundColor }, getBorder(), style]}
    >
      {content}
    </TouchableOpacity>
  );
};

export default Button;
