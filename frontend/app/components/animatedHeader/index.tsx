import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
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
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  title,
  scrollY,
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
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 24,
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
});
