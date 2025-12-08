import React, { useState, useEffect } from "react";
import { View, StyleSheet, ViewStyle, DimensionValue } from "react-native";
import ToggleButton from "./index";

type ToggleGroupProps = {
  options: string[];
  optionIcons?: { [key: string]: React.ReactNode };
  disabledOptions?: string[];  // Options that should be disabled
  initialValue?: string;
  onChange?: (value: string) => void;
  containerStyle?: ViewStyle;
};

const ToggleGroup: React.FC<ToggleGroupProps> = ({
  options,
  initialValue,
  optionIcons,
  disabledOptions = [],
  onChange,
  containerStyle,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(
    initialValue && options.includes(initialValue)
      ? options.indexOf(initialValue)
      : -1 // means nothing selected
  );

  // Sync selectedIndex when initialValue changes (but not on options changes)
  useEffect(() => {
    if (initialValue && options.includes(initialValue)) {
      setSelectedIndex(options.indexOf(initialValue));
    } else {
      setSelectedIndex(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    onChange?.(options[index]);
  };

  // Check if options are day names (to show abbreviated single letter)
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const isDayOptions = options.length === 7 && dayNames.includes(options[0]);

  const getItemsPerRow = () => {
    if (options.length === 3) return 3;
    if (options.length === 4) return 2;
    if (options.length === 6) return 3;
    if (options.length === 7) return isDayOptions ? 7 : 4; // Days: 7 per row, Time slots: 4 per row
    if (options.length === 8) return 4;
    return 2;
  };

  const itemsPerRow = getItemsPerRow();
  // Calculate width accounting for gaps (8px gap between items)
  // For flex-start with gap, we need slightly smaller widths
  const getItemWidth = () => {
    if (isDayOptions) return '12%'; // 7 items per row for days
    if (itemsPerRow === 4) return '23%'; // 4 items per row
    if (itemsPerRow === 3) return '31%'; // 3 items per row
    if (itemsPerRow === 2) return '48%'; // 2 items per row
    return '48%';
  };
  const itemWidth = getItemWidth() as DimensionValue;
  const buttonHeight = isDayOptions ? 86 : undefined;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.buttonGrid}>
        {options.map((option, index) => {
          // When there are 8 options, the 8th one is a blank placeholder
          const isPlaceholder = options.length === 8 && index === 7;

          return (
            <View key={`${option}-${index}`} style={{ width: itemWidth }}>
              {isPlaceholder ? (
                // NON-CLICKABLE BLANK ITEM
                <View
                  style={{
                    height: buttonHeight,
                    borderRadius: 24,
                    marginVertical: 6,
                    opacity: 0, // make it invisible but keep layout
                  }}
                />
              ) : (
                <ToggleButton
                  icon={optionIcons?.[option]}
                  label={
                    isDayOptions
                      ? option.charAt(0).toUpperCase()
                      : option
                  }
                  selected={selectedIndex === index}
                  disabled={disabledOptions.includes(option)}
                  onPress={() => handleSelect(index)}
                  style={{ height: buttonHeight }}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 8,
  },
});

export default ToggleGroup;
