import { TABS_DATA } from "@/constants/tabData";
import { useTheme } from "@/theme/useTheme";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Tabs from "@/components/tabs";

export default function Home() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

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
            Account
          </Text>
        </View>

         <ScrollView
                  contentContainerStyle={styles.scrollContainer}
                  showsVerticalScrollIndicator={false}
                >
          <View style={styles.body}>
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
  },
  header: {
    flexDirection: "row",
    gap: 8,
    height: 48,
  },
  body: {
    flexDirection: "column",
    gap: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80, // Space for bottom tabs
    gap: 24,
  },
});
