import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme/useTheme";
import { Icon } from "@/constants/icon";
import { PressableScale } from "react-native-pressable-scale";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";

type TabProps = {
  label: string;
  maxWidth: number;
  minWidth: number;
  isActive: boolean;
  onPress: () => void;
  icon: keyof typeof Icon;
};

const IconSize = 24;

export const Tab = ({
  label,
  maxWidth,
  minWidth,
  isActive,
  onPress,
  icon,
}: TabProps) => {
  const theme = useTheme(); // 👈 use theme here

  // Create an animated progress value that transitions between 0 and 1
  // based on whether the tab is active or not
  const progress = useDerivedValue(() => {
    return withTiming(isActive ? 1 : 0, {
      duration: 200, // Animation duration in milliseconds
    });
  }, [isActive]);

  // Animate the tab width between minWidth and maxWidth based on the progress
  const rTabStyle = useAnimatedStyle(() => {
    return {
      width: interpolate(progress.value, [0, 1], [minWidth, maxWidth]),
      backgroundColor: isActive
        ? theme.colors.navbar.background.active
        : "transparent",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center", //
    };
  }, [isActive, theme]);

  // Animate the gap between icon and text from 0 to 15 based on the progress
  const gap = useDerivedValue(() => {
    return interpolate(progress.value, [0, 1], [0, 8]);
  }, []);

  // Animate the text opacity and left margin based on the progress
  const rTextStyle = useAnimatedStyle(() => {
    return {
      // opacity: progress.value ** 3, // Cubic easing for opacity
      marginLeft: isActive ? gap.value : 0, 
      color: theme.colors.navbar.label.active,
      display: isActive ? "flex" : "none",
    };
  }, [isActive]);

  const IconComponent = Icon[icon];

  return (
    <PressableScale onPress={onPress}>
      <Animated.View style={[rTabStyle, styles.container]}>
        <View style={styles.innerContainer}>
          <View style={[styles.iconContainer]}>
            <IconComponent
              color={
                isActive
                  ? theme.colors.navbar.label.active
                  : theme.colors.navbar.label.default
              }
            />
          </View>

          <Animated.Text
            numberOfLines={1}
            key={label}
            style={[styles.label, rTextStyle]}
          >
            {label}
          </Animated.Text>
        </View>
      </Animated.View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  container: {
    borderCurve: "continuous",
    borderRadius: 48,
    height: 40,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: IconSize,
    width: IconSize,
    flexShrink: 0,
  },
  innerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignContent: "center",
    overflow: "hidden",
  },

  label: {
    fontSize: 16,
    fontWeight: "500",
    zIndex: 100,
  },
});
