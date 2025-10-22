import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "@/theme/useTheme";

type ButtonProps = {
  variant?: "filled" | "tonal" | "outline";
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
};

const Button: React.FC<ButtonProps> = ({
  variant = "filled",
  label,
  onPress,
  style,
  textStyle,
  disabled = false,
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
    return variant === "filled" || variant === "outline"
      ? theme.typography.body.md.medium
      : theme.typography.body.sm.medium;
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
    <Text style={[{ color: getTextColor(), ...getTextStyle() }, textStyle]}>
      {label}
    </Text>
  );

  const buttonStyle: ViewStyle = {
    paddingVertical: getPaddingVertical(),
    paddingHorizontal: 12,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  };

  if (variant === "filled" && !disabled) {
    const gradient = theme.colors.button.background.primary;

    return (
      <LinearGradient
        colors={gradient}
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
          <Text style={[{ color: getTextColor() }, textStyle]}>{label}</Text>
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

const styles = StyleSheet.create({});

export default Button;
