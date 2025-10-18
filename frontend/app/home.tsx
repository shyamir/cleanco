import { TABS_DATA } from "@/constants/tabData";
import { useTheme } from "@/theme/useTheme";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import GradientText from "./components/gradientText";
import { Tabs } from "./components/tabs";
import { StatusCard } from "./components/statusCard";

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
          </View>
          <View>

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
  },
  topContainer: {
    height: "50%",
  },
});
