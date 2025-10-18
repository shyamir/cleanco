import { TABS_DATA } from "@/constants/tabData";
import { useTheme } from "@/theme/useTheme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Tabs } from "./components/tabs";

export default function Home() {
  const theme = useTheme();

  return (
    <SafeAreaProvider style={{ backgroundColor: "#ff0000" }}>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.system.background.default },
        ]}
      >
        <View style={styles.header}>
          <Text
            style={[
              {
                ...theme.typography.heading.xs,
                color: theme.colors.system.body.tertiary,
              } as any,
            ]}
          >
            Activity
          </Text>
        </View>

        <View>
          <Tabs
            tabs={TABS_DATA}
          />
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
  },
  header: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
});
