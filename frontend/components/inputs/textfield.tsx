import React, { useState, useEffect } from "react";
import { TextInput, StyleSheet, View, Text, ViewStyle } from "react-native";
import { useTheme } from "@/theme/useTheme";

type TextFieldProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  containerStyle?: ViewStyle;
  secureTextEntry?: boolean;
  error?: string;
  success?: boolean;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
  showCharCount?: boolean;
  variant?: "default" | "onCard";
};

const TextField: React.FC<TextFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  containerStyle,
  secureTextEntry = false,
  error,
  success = false,
  maxLength,
  minLength,
  required = false,
  showCharCount = true,
  variant,
}) => {
  const theme = useTheme();
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
        style={[
          theme.typography.body.md.regular,
          styles.input,
          {
            backgroundColor: getBackgroundColor(),
            color: theme.colors.system.body.default,
            borderColor: getBorderColor(),
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.system.body.disabled}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        maxLength={maxLength}
      />

      <View style={styles.footer}>
        {showError ? (
          <Text
            style={[
              theme.typography.body.sm.regular,
              { color: theme.colors.input.label.error },
            ]}
          >
            {showError}
          </Text>
        ) : null}

        {showCharCount && maxLength ? (
          <Text
            style={[
              theme.typography.body.sm.regular,
              {
                color:
                  value.length >= (maxLength || 0)
                    ? theme.colors.input.label.error
                    : theme.colors.input.label.secondary,
              },
            ]}
          >
            {value.length}/{maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderRadius: 48,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  footer: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default TextField;
