import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/useTheme";

type CardProps = {
  title: string;
  duration: string;
  price: string;
  currency?: string;
};

const Card: React.FC<CardProps> = ({
  title,
  duration,
  price,
  currency = "MVR",
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.card.background.tertiary },
      ]}
    >
      <View style={styles.topSection}>
        <Text
          style={
            [
              theme.typography.body.md.regular,
              { color: theme.colors.system.body.default },
            ] as any
          }
        >
          {title}
        </Text>
        <View style={styles.durationRow}>
          <Ionicons
            name="time-outline"
            size={16}
            color={theme.colors.card.label.tertiary}
          />
          <Text
            style={
              [
                theme.typography.body.md,
                { color: theme.colors.card.label.tertiary},
              ] as any
            }
          >
            {duration}
          </Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.priceWrapper}>
          <Text
            style={
              [
                theme.typography.heading.xs2,
                { color: theme.colors.card.label.active },
              ] as any
            }
          >
            {price}
          </Text>
          <Text
            style={
              [
                theme.typography.body.md.medium,
                { color: theme.colors.card.label.active },
              ] as any
            }
          >
            {currency}
          </Text>
        </View>

        <Text
          style={
            [
              theme.typography.body.sm,
              { color: theme.colors.card.label.active },
            ] as any
          }
        >
          onwards
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexBasis: "48.5%", // roughly half width, allowing for gap
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    justifyContent: "space-between",
    height: 155,
  },
  topSection: {
    flexDirection: "column",
    gap: 4,
  },
  priceWrapper: {
    flexDirection: "row",
    gap: 4,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bottomSection: {
    flexDirection: "column",
    alignContent: "flex-end",
    alignItems: "flex-end",
  },
});

export default Card;
