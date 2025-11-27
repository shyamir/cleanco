import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { Href, useRouter } from "expo-router";
import BaseCard from "./base"; // adjust the path if needed

type ServiceCardProps = {
  title: string;
  duration: string;
  price: string;
  currency?: string;
  route: Href;
};

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  duration,
  price,
  currency = "MVR",
  route,
}) => {
  const {theme} = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (route) router.push(route);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      style={styles.touchWrapper}
    >
      <BaseCard>
        <View style={styles.container}>
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
                    theme.typography.heading.xs4.medium,
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
      </BaseCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: 24,
  },
  touchWrapper: {
    width: "48.8%",
  },
  topSection: {
    flexDirection: "column",
    gap: 4,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bottomSection: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginTop: "auto",
  },
  priceWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
});

export default ServiceCard;
