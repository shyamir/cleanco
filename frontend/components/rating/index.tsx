import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Icon } from "@/constants/icon";
import StarFilledIcon from "@/app/icons/starFilledIcon";

type RatingStarsProps = {
  value: number;
  onChange: (rating: number) => void;
  max?: number;
  size?: number;
};

const RatingStars: React.FC<RatingStarsProps> = ({
  value,
  onChange,
  max = 5,
  size = 36,
}) => {
  const {theme} = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: max }).map((_, i) => {
        const index = i + 1;
        const isActive = index <= value;

        return (
          <Pressable
            key={index}
            onPress={() => onChange(index)}
            android_ripple={{ color: "transparent" }}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            {isActive ? (
              <StarFilledIcon
                gradientColors={theme.colors.system.heading.secondary}
              />
            ) : (
              <Icon.star color={theme.colors.system.body.disabled} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default RatingStars;
