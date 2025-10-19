import { useTheme } from "@/theme/useTheme";
import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Button from "../button";

type CouponCardProps = {
  discountText: string;
  serviceText: string;
  buttonText: string;
  variant?: "orange" | "blue";
  onPress?: () => void;
};

const CouponCard: React.FC<CouponCardProps> = ({
  discountText,
  serviceText,
  buttonText,
  variant = "orange",
  onPress,
}) => {
  const theme = useTheme();

  const gradientColors =
    variant === "blue"
      ? theme.colors.card.background.primary
      : theme.colors.card.background.secondary;

  const imageSource =
    variant === "orange"
      ? require("@/assets/images/coupon-orange.png")
      : require("@/assets/images/coupon-blue.png");
  
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.container}>
        <View>
          <Text
            style={[
              {
                ...theme.typography.heading.xs3,
                color: theme.colors.card.label.default,
              } as any,
            ]}
          >
            {discountText}
          </Text>
          <Text
            style={[
              {
                ...theme.typography.body.md,
                color: theme.colors.card.label.default,
              } as any,
            ]}
          >
            {serviceText}
          </Text>
        </View>
        <View style={styles.buttonWrapper}>
          <Button label="Apply" variant="tonal" onPress={() => {}} />
        </View>
      </View>
        <Image source={imageSource} style={styles.image} resizeMode="contain" />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    alignSelf: "stretch",
  },

  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "column",
    gap: 8,
  },
  imageContainer: {
    flex: 1,
  },
  buttonWrapper: {
    alignSelf: "flex-start",
  },
  image: {
    position: "absolute",
    top: 0,
    right: 0,
    opacity: 0.4,
    resizeMode: "contain",
  },
});

export default CouponCard;
