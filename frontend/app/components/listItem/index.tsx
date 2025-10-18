import React from "react";
import {
  ImageSourcePropType,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useTheme } from "@/theme/useTheme";
import GradientText from "../gradientText";

type Props = {
  item: {
    line1: string;
    line2: string;
    description: string;
    image: ImageSourcePropType;
  };
  index: number;
  x: SharedValue<number>;
};

const ListItem: React.FC<Props> = ({ item, index, x }) => {
  const theme = useTheme();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  // Animated style for the image
  const imageStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [100, 0, 100],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
      width: SCREEN_WIDTH,
      height: SCREEN_WIDTH,
    };
  });

  // Animated style for the description
  const textStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [50, 0, 50],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // Animated style for line2 (optional stagger effect)
  const line2Style = useAnimatedStyle(() => {
    const translateY = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [30, 0, 30],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <View style={[styles.container, { width: SCREEN_WIDTH }]}>
      {/* Image */}
      <Animated.Image
        source={item.image}
        style={[styles.imageContainer, imageStyle]}
        resizeMode="cover"
      />

      {/* Text */}
      <View style={styles.textContainer}>
        <View style={styles.title}>
          <GradientText
            variant={theme.typography.heading.md}
            text={item.line1}
            colors={
              index === 1
                ? theme.colors.system.heading.default
                : theme.colors.system.heading.secondary
            }
          />
          <Animated.Text
            style={[
              line2Style,
              {
                ...theme.typography.heading.md,
                color: theme.colors.system.heading.tertiary,
              } as any,
            ]}
          >
            {item.line2}
          </Animated.Text>
        </View>

        <Animated.Text
          style={[
            styles.description,
            textStyle,
            {
              ...theme.typography.body.md.regular,
              color: theme.colors.system.body.tertiary,
            } as any,
          ]}
        >
          {item.description}
        </Animated.Text>
      </View>
    </View>
  );
};

export default React.memo(ListItem);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  textContainer: {
    marginHorizontal: 48,
  },
  title: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  description: {
    marginTop: 12,
    marginBottom: 12,
  },
  imageContainer: {
    flex: 1,
  },
});
