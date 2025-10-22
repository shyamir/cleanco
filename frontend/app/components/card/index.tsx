import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/useTheme";
import { Href, useRouter } from "expo-router";

type CardProps = {
  title: string;
  duration: string;
  price: string;
  currency?: string;
  route: Href; // optional route to navigate on press
};

const Card: React.FC<CardProps> = ({
  title,
  duration,
  price,
  currency = "MVR",
  route,
}) => {
  const theme = useTheme();

  const router = useRouter();

  const handlePress = () => {
    if (route) {
      router.push(route);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
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
            color={theme.colors.system.body.disabled}
          />
          <Text
            style={
              [
                theme.typography.body.md,
                { color: theme.colors.system.body.disabled },
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
    </TouchableOpacity>
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
