import { TABS_DATA } from "@/constants/tabData";
import { useTheme } from "@/theme/useTheme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import GradientText from "./components/gradientText";
import { Tabs } from "./components/tabs";
import { StatusCard } from "./components/statusCard";
import CouponCard from "./components/couponCard";
import Card from "./components/card";

export default function Home() {
  const theme = useTheme();

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.system.background.default },
        ]}
      >
        <View style={styles.header}>
          <GradientText
            text="Hello"
            colors={theme.colors.system.heading.secondary}
            variant={theme.typography.heading.xs}
          />
          <Text
            style={[
              {
                ...theme.typography.heading.xs,
                color: theme.colors.system.body.tertiary,
              } as any,
            ]}
          >
            Name
          </Text>
        </View>
        <View style={styles.body}>
          <View style={styles.topContainer}>
            <StatusCard
              title="Book your first service!"
              description="Professional services, just the way you want them"
            />
            <CouponCard
              discountText="Get 30% off!"
              serviceText="Home Cleaning Service"
              buttonText="Apply"
              variant="orange"
            />
          </View>
          <View style={styles.midContainer}>
            <Text
              style={[
                {
                  ...theme.typography.heading.xs3,
                  color: theme.colors.system.body.tertiary,
                } as any,
              ]}
            >
              Popular Services
            </Text>

            <View style={styles.cardWrapper}>
              <Card
                title="Home Cleaning"
                duration="1–4h"
                price="435"
                route="/home-cleaning" 
              />
              <Card
                title="Office Cleaning"
                duration="1–4h"
                price="435"
                route="/office-cleaning"
              />
            </View>

            <Text
              style={[
                {
                  ...theme.typography.body.md.regular,
                  color: theme.colors.system.body.disabled,
                } as any,
                styles.textWrapper,
              ]}
            >
              More services to come
            </Text>
          </View>
        </View>
        <View>
          <Tabs tabs={TABS_DATA} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    flexDirection: "column",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    gap: 8,
    height: "auto",
  },
  body: {
    flex: 1,
    gap: 48,
  },
  cardWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  topContainer: {
    height: "50%",
    flexDirection: "column",
    gap: 8,
  },
  textWrapper: {
    textAlign: "center",
    paddingTop: 16
  },
  midContainer: {
    flexDirection: "column",
    gap: 8,
  },
});
