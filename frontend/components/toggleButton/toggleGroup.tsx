import React, { useState } from "react";
import { View, StyleSheet, ViewStyle, DimensionValue } from "react-native";
import ToggleButton from "./index";

type ToggleGroupProps = {
  options: string[];
  initialValue?: string;
  onChange?: (value: string) => void;
  containerStyle?: ViewStyle;
};

const ToggleGroup: React.FC<ToggleGroupProps> = ({
  options,
  initialValue,
  onChange,
  containerStyle,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(
    initialValue && options.includes(initialValue)
      ? options.indexOf(initialValue)
      : -1 // means nothing selected
  );


  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    onChange?.(options[index]);
  };

  const getItemsPerRow = () => {
    if (options.length === 4) return 2;
    if (options.length === 6) return 3;
    if (options.length === 7) return 7;
    if (options.length === 8) return 4;
    return 2;
  };

  const itemsPerRow = getItemsPerRow();
  const itemWidth = `${100 / itemsPerRow - 2}%` as DimensionValue;
  const buttonHeight = options.length === 7 ? 86 : undefined;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.buttonGrid}>
        {options.map((option, index) => {
          const label =
            options.length === 7 ? option.charAt(0).toUpperCase() : option;

          return (
            <View key={`${option}-${index}`} style={{ width: itemWidth }}>
              <ToggleButton
                label={label}
                selected={selectedIndex === index}
                onPress={() => handleSelect(index)}
                style={{ height: buttonHeight }}
              />
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
    justifyContent: "space-between",
  },
});

export default ToggleGroup;
