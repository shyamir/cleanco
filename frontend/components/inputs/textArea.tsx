import React, { useState, useEffect } from "react";
import { TextInput, StyleSheet, View, Text, ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type TextAreaProps = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  numberOfLines?: number;
  containerStyle?: ViewStyle;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  success?: boolean;
  error?: string;
  showCharCount?: boolean;
  variant?: "default" | "onCard";
};

const TextArea: React.FC<TextAreaProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  numberOfLines = 4,
  containerStyle,
  required = false,
  minLength,
  maxLength,
  success = false,
  error,
    showCharCount = true,
  variant
}) => {
  const {theme} = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (required && value.trim().length === 0) {
      setValidationError("This field is required");
    } else if (minLength && value.length < minLength) {
      setValidationError(`Minimum ${minLength} characters required`);
    } else if (maxLength && value.length > maxLength) {
      setValidationError(`Maximum ${maxLength} characters allowed`);
    } else {
      setValidationError(null);
    }
  }, [value, required, minLength, maxLength]);

  const getBorderColor = () => {
    if (validationError || error) return theme.colors.input.border.error;
    if (success) return theme.colors.input.border.success;
    if (isFocused) return theme.colors.input.border.active;
    if (value.length > 0) return theme.colors.input.border.default;
    if (variant === "onCard") {
      return theme.colors.input.border.secondary;
    }
    return theme.colors.input.border.default;
  };
  const getLabelColor = () => {
    if (validationError || error) return theme.colors.input.label.error;
    if (success) return theme.colors.input.label.success;
    if (isFocused) return theme.colors.input.label.default;
    return theme.colors.input.label.default;
  };

  const getBackgroundColor = () => {
    if (validationError || error) return theme.colors.input.background.error;
    if (success) return theme.colors.input.background.success;
    if (isFocused) return theme.colors.input.background.active;

    if (variant === "onCard") {
      return theme.colors.input.background.secondary;
    }
    return theme.colors.input.background.default;
  };


  const showError = validationError || error;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            theme.typography.body.md.regular,
            { color: getLabelColor(), marginBottom: 4 },
          ]}
        >
          {label}{" "}
          {required && (
            <Text style={{ color: theme.colors.input.label.error }}>*</Text>
          )}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.system.body.disabled}
        multiline
        numberOfLines={numberOfLines}
        textAlignVertical="top"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          theme.typography.body.md.regular,
          styles.textarea,
          {
            backgroundColor: getBackgroundColor(),
            color: theme.colors.system.body.default,
            borderColor: getBorderColor(),
          },
        ]}
      />

      <View style={styles.footer}>
        {showError && (
          <Text
            style={[
              theme.typography.body.sm.regular,
              { color: theme.colors.input.label.error },
            ]}
          >
            {showError}
          </Text>
        )}

        {showCharCount && maxLength && (
          <Text
            style={[
              theme.typography.body.sm.regular,
              {
                color:
                  value.length >= maxLength
                    ? theme.colors.input.label.error
                    : theme.colors.input.label.secondary,
              },
            ]}
          >
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 68,
  },
  footer: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default TextArea;
