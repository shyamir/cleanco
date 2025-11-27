import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import Base from "./base";
import { Icon } from "@/constants/icon";

type PropertyDetailsCardProps = {
  title?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryValue: number;
  secondaryValue: number;
  onPrimaryChange: (value: number) => void;
  onSecondaryChange: (value: number) => void;
  max?: number;
};

const PropertyDetailsCard: React.FC<PropertyDetailsCardProps> = ({
  title,
  primaryLabel = "Bedrooms",
  secondaryLabel = "Bathrooms",
  primaryValue,
  secondaryValue,
  onPrimaryChange,
  onSecondaryChange,
  max = 5,
}) => {
  const {theme} = useTheme();

  useEffect(() => {
    if (primaryValue < 1) onPrimaryChange(1);
    if (secondaryValue < 1) onSecondaryChange(1);
  }, []);

  const handleChange = (
    type: "primary" | "secondary",
    operation: "increment" | "decrement"
  ) => {
    if (type === "primary") {
      if (operation === "increment" && primaryValue < max)
        onPrimaryChange(primaryValue + 1);
      if (operation === "decrement" && primaryValue > 1)
        onPrimaryChange(primaryValue - 1);
    } else {
      if (operation === "increment" && secondaryValue < max)
        onSecondaryChange(secondaryValue + 1);
      if (operation === "decrement" && secondaryValue > 1)
        onSecondaryChange(secondaryValue - 1);
    }
  };

  const renderCounter = (
    label: string,
    value: number,
    type: "primary" | "secondary"
  ) => {
    const isMinusDisabled = value <= 1;
    const isPlusDisabled = value >= max;

    return (
      <View style={styles.row}>
        <Text
          style={[
            {
              ...theme.typography.body.md.regular,
              color: theme.colors.toggle.label.default,
            } as any,
          ]}
        >
          {label}
        </Text>
        <View
          style={[
            styles.counterContainer,
            { backgroundColor: theme.colors.toggle.background.default },
          ]}
        >
          <TouchableOpacity
            style={[styles.circleButton, isMinusDisabled && { opacity: 0.3 }]}
            onPress={() => !isMinusDisabled && handleChange(type, "decrement")}
            disabled={isMinusDisabled}
          >
            <Icon.minus color={theme.colors.toggle.label.active} />
          </TouchableOpacity>

          <Text
            style={[
              styles.value,
              {
                ...theme.typography.body.md.regular,
                color: theme.colors.toggle.label.default,
              } as any,
            ]}
          >
            {value}
          </Text>

          <TouchableOpacity
            style={[styles.circleButton, isPlusDisabled && { opacity: 0.3 }]}
            onPress={() => !isPlusDisabled && handleChange(type, "increment")}
            disabled={isPlusDisabled}
          >
            <Icon.add color={theme.colors.toggle.label.active} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Base>
      <View style={styles.container}>
        {title && (
          <Text
            style={[
              {
                ...theme.typography.heading.xs4.book,
                color: theme.colors.system.heading.tertiary,
              } as any,
            ]}
          >
            {title}
          </Text>
        )}
        <View style={styles.wrapper}>
          {renderCounter(primaryLabel, primaryValue, "primary")}
          {renderCounter(secondaryLabel, secondaryValue, "secondary")}
        </View>
      </View>
    </Base>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "column",
    gap: 12,
  },
  wrapper: {
    flexDirection: "column",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  counterContainer: {
    width: 110,
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  circleButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  value: {
    marginHorizontal: 12,
  },
});

export default PropertyDetailsCard;
