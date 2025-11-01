import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  interpolateColor,
  SharedValue,
} from "react-native-reanimated";

import { useTheme } from "@/theme/useTheme";

type Props = {
  length: number;
  x: SharedValue<number>;
};

const Pagination: React.FC<Props> = ({ length, x }) => {
  const theme = useTheme();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const Dot: React.FC<{ index: number }> = ({ index }) => {
    const style = useAnimatedStyle(() => {
      const dotWidth = interpolate(
        x.value,
        [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ],
        [8, 8, 8],
        Extrapolation.CLAMP
      );

      const backgroundColor = interpolateColor(
        x.value,
        [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ],
        [
          theme.colors.pagination.background.default,
          theme.colors.pagination.background.active,
          theme.colors.pagination.background.default,
        ]
      );

      return {
        width: dotWidth,
        backgroundColor,
      };
    });

    return <Animated.View style={[styles.dot, style]} />;
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, idx) => (
        <Dot index={idx} key={idx} />
      ))}
    </View>
  );
};

export default Pagination;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 48,
  },
  dot: {
    height:8,
    borderRadius: 5,
    marginHorizontal: 5,
  },
});
