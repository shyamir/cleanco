import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "@/theme/useTheme";
import BaseCard from "./base";

const BookServiceCard = () => {
  const theme = useTheme();

  return (
    <BaseCard colors={theme.colors.card.background.primary}>
      <View style={styles.container}>
        <View style={styles.textWrapper}>
          <Text
            style={[
              {
                ...theme.typography.heading.xs2,
                color: theme.colors.card.label.default,
              } as any,
            ]}
          >
            Book your first service!
          </Text>

          <Text
            style={[
              {
                ...theme.typography.body.md,
                color: theme.colors.card.label.secondary,
              } as any,
              styles.text,
            ]}
          >
            Professional services, just the way you want them.
          </Text>
        </View>
        <View style={styles.imageWrapper}>
          <Image
            source={require("@/assets/images/first-service.png")}
            resizeMode="contain"
          />
        </View>
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "space-around",
    height: "100%",
  },
  textWrapper: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignContent: "center",
    width: "80%",
  },
  text: { textAlign: "center" },
  imageWrapper: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignItems: "center",
  },
});

export default BookServiceCard;
