import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  useAnimatedStyle,
  withTiming,
  SharedValue,
  AnimatedRef
} from "react-native-reanimated";


type Props = {
  currentIndex: SharedValue<number>;
  length: number;
  flatListRef: AnimatedRef<Animated.FlatList<any>>; 
};

const OnboardingButton: React.FC<Props> = ({
  currentIndex,
  length,
  flatListRef,
}) => {
  // Animated style for "Next" text
  const nextTextStyle = useAnimatedStyle(() => ({
    opacity: currentIndex.value === length - 1 ? withTiming(0) : withTiming(1),
  }));

  // Animated style for "Get Started" text
  const startTextStyle = useAnimatedStyle(() => ({
    opacity: currentIndex.value === length - 1 ? withTiming(1) : withTiming(0),
  }));

  const onPress = useCallback(() => {
    if (currentIndex.value === length - 1) {
      console.log("Get Started pressed");
      // Add navigation here if needed, e.g., router.push("/home")
    } else {
      flatListRef.current?.scrollToIndex({
        index: currentIndex.value + 1,
        animated: true,
      });
    }
  }, [currentIndex, length, flatListRef]);

  return (
    <Animated.View style={styles.btn}>
      <Pressable
        onPress={onPress}
        style={{ flex: 1, borderRadius: 48, overflow: "hidden" }}
      >
        <LinearGradient
          colors={["#1E40AF", "#3B82F6"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        >
          <Animated.Text style={[styles.text, nextTextStyle]}>
            Next
          </Animated.Text>
          <Animated.Text style={[styles.text, startTextStyle]}>
            Get Started
          </Animated.Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default OnboardingButton;

const styles = StyleSheet.create({
  btn: {
    width: 199,
    height: 48,
    borderRadius: 48,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    position: "absolute", // stack "Next" and "Get Started"
    textAlign: "center",
  },
});
