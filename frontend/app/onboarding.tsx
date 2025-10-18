import { useTheme } from "@/theme/useTheme";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// components
import ListItem from "./components/listItem";
import OnboardingButton  from "./components/onboardingButton";

import Pagination from "./components/pagination";

type Page = { line1: string; line2: string; description: string; image: any };

const pages: Page[] = [
  {
    line1: "Any",
    line2: "Space",
    description: "From cozy homes to busy offices, we make every place shine.",
    image: require("../assets/images/slide1.png"),
  },
  {
    line1: "Easy",
    line2: "Booking",
    description:
      "Choose your service, set the time, and relax — we’ll handle the rest.",
    image: require("../assets/images/slide1.png"),
  },
  {
    line1: "Trusted",
    line2: "Service",
    description:
      "Skilled, reliable cleaners delivering top-quality results every time.",
    image: require("../assets/images/slide3.png"),
  },
];
export default function Onboarding() {
  const theme = useTheme(); 
  const x = useSharedValue(0);
  const currentIndex = useSharedValue(0);
  const flatListRef = useAnimatedRef<Animated.FlatList<Page>>();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      x.value = event.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      const idx = viewableItems[0]?.index;
      if (idx !== null && idx !== undefined) {
        currentIndex.value = idx;
      }
    },
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Page; index: number }) => {
      return <ListItem item={item} index={index} x={x} />;
    },
    []
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.system.background.secondary },
      ]}
    >
      <TouchableOpacity
        style={[styles.skipButton]}
        onPress={() => router.push("/home")}
      >
        <Text
          style={[
            styles.skipText,
            {
              ...theme.typography.body.sm.regular,
              color: theme.colors.button.label.secondary,
            },
          ]}
        >
          Skip
        </Text>
      </TouchableOpacity>

      <View style={styles.bodyContainer}>
        <Animated.FlatList
          ref={flatListRef}
          data={pages}
          horizontal
          pagingEnabled
          scrollEventThrottle={16}
          onScroll={scrollHandler}
          showsHorizontalScrollIndicator={false}
          renderItem={renderItem}
          keyExtractor={(_, idx) => idx.toString()}
          bounces={false}
          onViewableItemsChanged={onViewableItemsChanged}
        />
        <Pagination length={pages.length} x={x} />
      </View>

      <View style={styles.bottomContainer}>
        <OnboardingButton
          currentIndex={currentIndex}
          length={pages.length}
          flatListRef={flatListRef}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    padding: 8,
    marginTop: 56,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "500",
  },
  bodyContainer: { flex: 1, gap: 16 },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});
