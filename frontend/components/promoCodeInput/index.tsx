import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import Button from "../button";

interface PromoCodeInputProps {
  value: string;
  onApply: (code: string) => Promise<void>;
  onClear: () => void;
  isApplied: boolean;
  isLoading: boolean;
  error: string | null;
  discount: number;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | null;
  discountValue: number;
}

const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  value,
  onApply,
  onClear,
  isApplied,
  isLoading,
  error,
  discount,
  discountType,
  discountValue,
}) => {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  const handleApply = async () => {
    if (inputValue.trim()) {
      await onApply(inputValue.trim().toUpperCase());
    }
  };

  const handleClear = () => {
    setInputValue("");
    onClear();
  };

  const getBorderColor = () => {
    if (error) return theme.colors.input.border.error;
    if (isApplied) return theme.colors.input.border.success;
    if (isFocused) return theme.colors.input.border.active;
    return theme.colors.input.border.default;
  };

  return (
    <View style={styles.container}>
      <Text
        style={[
          theme.typography.body.sm.medium as any,
          { color: theme.colors.system.body.default },
        ]}
      >
        Promo Code
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.input.background.default,
              color: theme.colors.system.body.default,
              borderColor: getBorderColor(),
            },
          ]}
          value={inputValue}
          onChangeText={(text) => setInputValue(text.toUpperCase())}
          placeholder="Enter promo code"
          placeholderTextColor={theme.colors.system.body.disabled}
          editable={!isApplied && !isLoading}
          autoCapitalize="characters"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        <View style={styles.buttonWrapper}>
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={theme.colors.system.body.default}
            />
          ) : isApplied ? (
            <Button label="Remove" variant="outline" size="small" onPress={handleClear} />
          ) : (
            <Button
              label="Apply"
              variant="filled"
              size="small"
              onPress={handleApply}
              disabled={!inputValue.trim()}
            />
          )}
        </View>
      </View>

      {error && (
        <Text
          style={[
            theme.typography.body.xs.regular as any,
            { color: theme.colors.input.label.error },
          ]}
        >
          {error}
        </Text>
      )}
      {isApplied && discountType && (
        <Text
          style={[
            theme.typography.body.xs.regular as any,
            { color: theme.colors.input.label.success },
          ]}
        >
          {discountType === "PERCENTAGE"
            ? `${discountValue}% off! You save ${discount.toFixed(0)} MVR`
            : `${discountValue} MVR off!`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 32,
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 0,
    borderRadius: 32,
    borderWidth: 1,
    fontSize: 13,
    lineHeight: 16,
  },
  buttonWrapper: {
    minWidth: 64,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PromoCodeInput;
