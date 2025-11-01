import { TABS_DATA } from "@/constants/tabData";
import { useTheme } from "@/theme/useTheme";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import GradientText from "@/components/gradientText";
import Tabs from "../components/tabs";
import { StatusCard } from "@/components/statusCard";
import CouponCard from "../components/couponCard";
import ServiceCard from "../components/card/serviceCard";
import { Dimensions } from "react-native";

export default function Home() {
  const theme = useTheme();
  const { height } = Dimensions.get("window");

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
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topContainer}>
            <StatusCard
              hasService={false}
              hasOngoingJob={false}
              hasPaymentDue={true}
              cleaningStatus="done"
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
                  ...theme.typography.heading.xs3.medium,
                  color: theme.colors.system.body.tertiary,
                } as any,
              ]}
            >
              Popular Services
            </Text>

            <View style={styles.cardWrapper}>
              <ServiceCard
                title="Home Cleaning"
                duration="1–4h"
                price="435"
                route="/home-cleaning"
              />
              <ServiceCard
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
        </ScrollView>

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
    flexDirection: "column",
    gap: 8,
    alignSelf: "stretch", 
  },

  textWrapper: {
    textAlign: "center",
    paddingTop: 16,
  },
  midContainer: {
    flexDirection: "column",
    gap: 8,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80, // Space for bottom tabs
    gap: 24,
  },
});
