// src/components/card/squareFeetCard.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import Base from "./base";
import AnimatedSlider from "../animatedSlider";

type SquareFeetCardProps = {
  initialValue?: number;
  onChange?: (value: number) => void;
};

const SquareFeetCard: React.FC<SquareFeetCardProps> = ({
  initialValue = 100,
  onChange,
}) => {
  const {theme} = useTheme();
  const [value, setValue] = useState(initialValue);

  const handleChange = (val: number) => {
    setValue(val);
    onChange?.(val);
  };

  return (
    <Base>
      <View style={styles.header}>
        <Text
          style={[
            {
              ...theme.typography.heading.xs4.book,
              color: theme.colors.system.heading.tertiary,
            } as any,
          ]}
        >
          Square Feet
        </Text>
        <View style={styles.wrapper}>
          <Text
            style={[
              {
                ...theme.typography.body.md.regular,
                color: theme.colors.toggle.label.active,
              } as any,
            ]}
          >
            {value}
          </Text>
          <Text
            style={[
              {
                ...theme.typography.body.md.regular,
                color: theme.colors.toggle.label.default,
              } as any,
            ]}
          >
            sqft
          </Text>
        </View>
      </View>
      <AnimatedSlider
        min={100}
        max={5000}
        initialValue={initialValue}
        onChange={handleChange}
      />
    </Base>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontWeight: "600",
  },
  wrapper: {
    flexDirection: "row",
    gap: 2,
  },
});

export default SquareFeetCard;
