import { useTheme } from "@/theme/ThemeProvider";
import React, { forwardRef, useState, ReactNode } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from "react-native";

type PrefixedTextFieldProps = {
  prefix?: string;
  value: string;
  onChangeText: (digits: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  maxLength?: number;
  keyboardType?: TextInputProps["keyboardType"];
  showCharCount?: boolean;
  underline?: boolean;
  autoFocus?: boolean;
  error?: string;
  success?: boolean;
  label?: string;
  rightIcon?: ReactNode;
  onPress?: () => void;
};

const PrefixedTextField = forwardRef<TextInput, PrefixedTextFieldProps>(
  (
    {
      prefix = "(+960)",
      value,
      onChangeText,
      placeholder = "9999999",
      containerStyle,
      inputStyle,
      maxLength = 7,
      keyboardType = "numeric",
      underline = false,
      autoFocus,
      error,
      success = false,
      showCharCount = false,
      label,
      rightIcon,
      onPress,
    },
    ref
  ) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const formatDigits = (digits: string) => digits.replace(/[^0-9]/g, "");
    const display = formatDigits(value || "");

    const handleChange = (text: string) => {
      const digits = text.replace(/[^0-9]/g, "").slice(0, maxLength);
      onChangeText(digits);
    };

    const getBorderColor = () => {
      if (error) return theme.colors.input.border.error;
      if (success) return theme.colors.input.border.success;
      if (isFocused) return theme.colors.input.border.active;
      return underline
        ? theme.colors.input.border.secondary
        : theme.colors.input.border.default;
    };

    const getBackgroundColor = () => {
      if (error) return theme.colors.input.background.error;
      if (success) return theme.colors.input.background.success;
      if (isFocused) return theme.colors.input.background.active;
      return underline
        ? theme.colors.input.background.secondary
        : theme.colors.input.background.default;
    };

    return (
      <View style={[styles.outer, containerStyle]}>
        {label && (
          <Text
            style={[
              theme.typography.body.md.regular,
              { color: theme.colors.input.label.default, marginBottom: 4 },
            ]}
          >
            {label}
          </Text>
        )}

        <View
          style={[
            styles.inputPill,
            underline ? styles.underlinePill : null,
            {
              borderColor: getBorderColor(),
              backgroundColor: getBackgroundColor(),
            },
          ]}
        >
          {/* Prefix */}
          <Text
            style={[
              theme.typography.body.md.regular,
              {
                color: theme.colors.input.label.disabled,
                marginRight: 8,
              },
            ]}
          >
            {prefix}
          </Text>

          {/* Input */}
          <TextInput
            ref={ref}
            value={display}
            onChangeText={handleChange}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.input.label.secondary}
            keyboardType={keyboardType}
            style={[
              styles.input,
              inputStyle,
              theme.typography.body.md.regular,
              {
                color: theme.colors.system.body.default,
                flex: 1,
              },
            ]}
            maxLength={maxLength}
            selectionColor={theme.colors.input.label.active}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus={autoFocus}
            onPress={onPress}
          />

          {/* Right icon */}
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  outer: { width: "100%", gap: 0 },
  inputPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 48,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: 48,
    // paddingVertical: 8, // fixes vertical alignment for placeholder and typed text
    textAlignVertical: "center",
  },
  underlinePill: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default PrefixedTextField;
