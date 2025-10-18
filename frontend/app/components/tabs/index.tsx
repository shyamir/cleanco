import { StyleSheet, useWindowDimensions } from "react-native";
import { useRouter, usePathname, Href } from "expo-router";
import LinearGradient from "react-native-linear-gradient";

import { useTheme } from "@/theme/useTheme";
import { Tab } from "./tab";
import { Icon } from "@/constants/icon";

type TabsProps = {
  tabs: { label: string; icon: keyof typeof Icon; route: Href }[];
};

export const Tabs = ({ tabs }: TabsProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = windowWidth * 0.7; // 80% of screen
  const containerPadding = 4; // paddingHorizontal inside container
  const inactiveWidth = 60;
  const gap = 4; // gap between tabs
  const tabsCount = tabs.length;

  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  // remaining width for active tab
  const activeWidth =
    containerWidth -
    2 * containerPadding - // left + right padding
    inactiveWidth * (tabsCount - 1) - // inactive tab widths
    gap * (tabsCount - 1); // gaps between all tabs

  return (
    <LinearGradient
      colors={[
        theme.colors.navbar.background.default,
        theme.colors.navbar.background.secondary,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.container,
        { width: containerWidth, paddingHorizontal: containerPadding },
      ]}
    >
      {tabs.map((tab, index) => {
        const isActive = pathname === tab.route;
        return (
          <Tab
            key={index}
            onPress={() => router.push(tab.route)}
            icon={tab.icon}
            label={tab.label}
            maxWidth={activeWidth}
            minWidth={inactiveWidth}
            isActive={isActive}
          />
        );
      })}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: "row",
    borderRadius: 48,
    justifyContent: "flex-start", // let tabs flow naturally
    alignItems: "center",
    alignSelf: "center",
  },
});
