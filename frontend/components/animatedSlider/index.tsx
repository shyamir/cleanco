// src/components/card/animatedSlider.tsx
import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Pressable,
  GestureResponderEvent,
} from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type AnimatedSliderProps = {
  min: number;
  max: number;
  initialValue?: number;
  onChange?: (value: number) => void;
};

const AnimatedSlider: React.FC<AnimatedSliderProps> = ({
  min,
  max,
  initialValue = min,
  onChange,
}) => {
  const {theme} = useTheme();
  const width = 335; // slider width in px (adjust as needed)
  const thumbRadius = 12;
  const trackHeight = 12;

  const thumbDiameter = thumbRadius * 2;
  const offset = useRef(
    ((initialValue - min) / (max - min)) * (width - thumbDiameter)
  );
  const animatedValue = useRef(new Animated.Value(offset.current)).current;
  const currentValue = useRef(initialValue);

  // === Function to move slider based on position ===
  const moveThumbTo = (x: number, animate = true) => {
    let newX = Math.max(0, Math.min(x, width - thumbDiameter));
    const newValue = min + (newX / (width - thumbDiameter)) * (max - min);

    offset.current = newX;
    currentValue.current = newValue;
    onChange?.(Math.round(newValue));

    if (animate) {
      Animated.timing(animatedValue, {
        toValue: newX,
        duration: 150,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(newX);
    }
  };

  // === Handle tap anywhere on the slider ===
  const handleTap = (e: GestureResponderEvent) => {
    const tapX = e.nativeEvent.locationX;
    moveThumbTo(tapX, true);
  };

  // === PanResponder for dragging ===
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        let newX = offset.current + gestureState.dx;
        if (newX < 0) newX = 0;
        if (newX > width - thumbDiameter) newX = width - thumbDiameter;

        animatedValue.setValue(newX);

        const rawValue = min + (newX / (width - thumbDiameter)) * (max - min);
        const snappedValue = Math.round(rawValue / 10) * 10;

        if (snappedValue !== currentValue.current) {
          currentValue.current = snappedValue;
          onChange?.(snappedValue);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        offset.current += gestureState.dx;
        if (offset.current < 0) offset.current = 0;
        if (offset.current > width - thumbDiameter)
          offset.current = width - thumbDiameter;

        const snappedValue =
          Math.round(
            ((offset.current / (width - thumbDiameter)) * (max - min) + min) /
              10
          ) * 10;

        offset.current =
          ((snappedValue - min) / (max - min)) * (width - thumbDiameter);
        animatedValue.setValue(offset.current);

        if (snappedValue !== currentValue.current) {
          currentValue.current = snappedValue;
          onChange?.(snappedValue);
        }
      },
    })
  ).current;

  const thumbStyle = {
    transform: [
      {
        translateX: animatedValue.interpolate({
          inputRange: [0, width - thumbDiameter],
          outputRange: [0, width - thumbDiameter],
          extrapolate: "clamp",
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handleTap}>
        <View
          style={[
            styles.track,
            {
              backgroundColor: theme.colors.system.background.default,
              width,
              height: trackHeight,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.activeTrack,
            {
              backgroundColor: theme.colors.input.label.active,
              width: animatedValue,
              height: trackHeight,
            },
          ]}
        />
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.thumb,
            {
              left: animatedValue,
              backgroundColor: theme.colors.system.background.default,
              borderColor: theme.colors.input.label.active,
              borderWidth: 2,
              width: thumbDiameter,
              height: thumbDiameter,
              borderRadius: thumbRadius,
              top: -(thumbRadius - trackHeight / 2),
            },
          ]}
        />
      </Pressable>

      <View style={styles.valueContainer}>
        <Text
          style={[
            {
              ...theme.typography.body.md.regular,
              color: theme.colors.toggle.label.default,
            } as any,
          ]}
        >
          100
        </Text>
        <Text
          style={[
            {
              ...theme.typography.body.md.regular,
              color: theme.colors.toggle.label.default,
            } as any,
          ]}
        >
          5000+
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 16,
  },
  track: {
    borderRadius: 48,
  },
  activeTrack: {
    position: "absolute",
    left: 1,
    borderTopLeftRadius: 48,
    borderBottomLeftRadius: 48,
  },
  thumb: {
    position: "absolute",
  },
  valueContainer: {
    width: "100%",
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default AnimatedSlider;
