import React, { useState, forwardRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from "react-native";
import { useTheme } from "@/theme/useTheme";
import { Icon } from "@/constants/icon";

type SearchBarProps = {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onClear?: () => void;
  autoFocus?: boolean;
};

const SearchBar = forwardRef<TextInput, SearchBarProps>(
  (
    { placeholder = "Search", value, onChangeText, onClear, autoFocus = false },
    ref
  ) => {
    const theme = useTheme();
    const [text, setText] = useState(value || "");
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = (input: string) => {
      setText(input);
      onChangeText?.(input);
    };

    const handleClear = () => {
      setText("");
      onClear?.();
      Keyboard.dismiss();
      setIsFocused(false);
    };

    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isFocused
              ? theme.colors.input.background.active
              : theme.colors.input.background.default,
            borderColor: isFocused
              ? theme.colors.input.border.active
              : theme.colors.input.border.default,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Icon.search color={theme.colors.system.body.disabled} />
        </View>

        <TextInput
          ref={ref} // ✅ accept external ref
          style={[
            styles.input,
            {
              ...theme.typography.body.md.regular,
              color: theme.colors.input.label.default,
            } as any,
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.system.body.disabled}
          value={text}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="search"
        />

        {text.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearIcon}>
            <Icon.close color={theme.colors.system.body.disabled} />
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 48,
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    textAlignVertical: "center",
    includeFontPadding: false,
    paddingVertical: 0,
  },
  clearIcon: {
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SearchBar;
