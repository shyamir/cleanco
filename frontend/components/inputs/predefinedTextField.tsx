import { useTheme } from "@/theme/useTheme";
import React, { forwardRef, useState } from "react";
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
};

const PrefixedTextField = forwardRef<TextInput, PrefixedTextFieldProps>(
  (
    {
      prefix = "(+960)",
      value,
      onChangeText,
      placeholder = "999-9999",
      containerStyle,
      inputStyle,
      maxLength = 7,
      keyboardType = "numeric",
      underline = false,
      autoFocus,
      error,
      success = false,
      showCharCount = false,
    },
    ref
  ) => {
    const theme = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const formatDigits = (digits: string) => digits.replace(/[^0-9]/g, "");

    const display = formatDigits(value || "");

    const handleChange = (text: string) => {
      const digits = text.replace(/[^0-9]/g, "").slice(0, maxLength);
      onChangeText(digits);
    };

    // dynamic border/background like TextField
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
              theme.typography.body.sm.regular,
              {
                color: theme.colors.input.label.disabled,
                // marginRight: 8, // spacing between prefix and input
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
              {
                color: theme.colors.system.body.default,
                flex: 1, // take remaining space
                paddingVertical: 0, // let container handle vertical padding
                textAlignVertical: "center",
              },
            ]}
            maxLength={maxLength + (display.includes("-") ? 1 : 0)}
            selectionColor={theme.colors.input.label.active}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus={autoFocus}
          />
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  outer: { width: "100%", gap: 6 },
  inputPill: {
    flexDirection: "row",
    alignItems: "center", // ensures vertical centering of prefix and input
    borderWidth: 1,
    borderRadius: 48,
    paddingHorizontal: 14,
    paddingVertical: 12, // this padding now centers both prefix and input
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    textAlignVertical: "center", // important for Android
  },
  underlinePill: { borderWidth: 0, borderBottomWidth: 1, borderRadius: 0 },
});

export default PrefixedTextField;
