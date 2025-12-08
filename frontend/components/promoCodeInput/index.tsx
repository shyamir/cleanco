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
          theme.typography.body.md.medium as any,
          { color: theme.colors.system.body.default },
        ]}
      >
        Promo Code
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={[
            theme.typography.body.md.regular as any,
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
            <Button label="Remove" variant="outline" onPress={handleClear} />
          ) : (
            <Button
              label="Apply"
              variant="filled"
              onPress={handleApply}
              disabled={!inputValue.trim()}
            />
          )}
        </View>
      </View>

      {error && (
        <Text
          style={[
            theme.typography.body.sm.regular as any,
            { color: theme.colors.input.label.error, marginTop: 4 },
          ]}
        >
          {error}
        </Text>
      )}

      {isApplied && discountType && (
        <Text
          style={[
            theme.typography.body.sm.regular as any,
            { color: theme.colors.input.label.success, marginTop: 4 },
          ]}
        >
          {discountType === "PERCENTAGE"
            ? `${discountValue}% discount applied! You save ${discount.toFixed(0)} MVR`
            : `${discountValue} MVR discount applied!`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 8,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 48,
    borderWidth: 1,
  },
  buttonWrapper: {
    minWidth: 80,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PromoCodeInput;
