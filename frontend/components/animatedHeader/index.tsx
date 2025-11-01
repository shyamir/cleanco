import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useTheme } from "@/theme/useTheme";

const BACK_BUTTON_SIZE = 48;
const SCROLL_DISTANCE = 100;
const TITLE_MAX_FONT = 48;
const TITLE_MIN_FONT = 36;
const TITLE_MAX_LINE_HEIGHT = 48;
const TITLE_MIN_LINE_HEIGHT = 38;

type AnimatedHeaderProps = {
  title: string;
  scrollY: Animated.Value; // Passed from parent
  animatedImage?: ImageSourcePropType; // NEW: image to fade out
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  title,
  scrollY,
  animatedImage,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const navigation = useNavigation();

  // Font size and line height animation
  const titleFontSize = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [TITLE_MAX_FONT, TITLE_MIN_FONT],
    extrapolate: "clamp",
  });

  const titleLineHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [TITLE_MAX_LINE_HEIGHT, TITLE_MIN_LINE_HEIGHT],
    extrapolate: "clamp",
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [64, 0],
    extrapolate: "clamp",
  });

  const titleTranslateX = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [-48, 5],
    extrapolate: "clamp",
  });

  const titleMaxWidth = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [200, 400],
    extrapolate: "clamp",
  });

  // New image fade-out
  const newImageOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.headerContainer, style]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons
          name="arrow-back-outline"
          size={24}
          color={theme.colors.system.heading.active}
        />
      </TouchableOpacity>

      <Animated.View
        style={{
          transform: [
            { translateY: titleTranslateY },
            { translateX: titleTranslateX },
          ],
          marginLeft: 8,
          maxWidth: titleMaxWidth,
        }}
      >
        <Animated.Text
          style={[
            {
              ...theme.typography.heading.sm,
              color: theme.colors.system.heading.active,
              fontSize: titleFontSize,
              lineHeight: titleLineHeight,
              opacity: 0.7,
            } as any,
            textStyle,
          ]}
        >
          {title}
        </Animated.Text>
      </Animated.View>

      {/* Existing watermark image */}
      <Image
        source={require("@/assets/images/service.png")}
        style={styles.watermark}
        resizeMode="contain"
      />

      {/* Animated image passed via prop */}
      {animatedImage && (
        <Animated.Image
          source={animatedImage}
          style={[styles.headerImage, { opacity: newImageOpacity }]}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  watermark: {
    position: "absolute",
    right: 0,
    zIndex: -10,
  },
  headerImage: {
    position: "absolute",
    right: 16,
    top: 68,
  },
});

export default AnimatedHeader;
