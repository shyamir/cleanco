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
  const [selected, setSelected] = useState(initialValue || options[0]);

  const handleSelect = (option: string) => {
    setSelected(option);
    onChange?.(option);
  };

  const getItemsPerRow = () => {
    if (options.length === 4) return 2;
    if (options.length === 6) return 3;
    if (options.length === 8) return 4;
    return 2;
  };

  const itemsPerRow = getItemsPerRow();
  const itemWidth = `${100 / itemsPerRow - 2}%` as DimensionValue;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.buttonGrid}>
        {options.map((option) => (
          <View key={option} style={{ width: itemWidth }}>
            <ToggleButton
              label={option}
              selected={selected === option}
              onPress={() => handleSelect(option)}
            />
          </View>
        ))}
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
