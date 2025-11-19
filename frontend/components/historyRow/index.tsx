import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { useRouter } from "expo-router";
import Button from "../button";

type HistoryRowProps = {
  booking: {
    id: string;
    title: string;
    date: string;
    time: string;
    total: string;
    type: string;
    address: string;
    image?: any; // image source
    status: "upcoming" | "completed" | "cancelled" | "pending";
  };
};

export default function HistoryRow({ booking }: HistoryRowProps) {
  const theme = useTheme();
  const router = useRouter();

  const handleRebook = () => {
    // router.push(`/booking-details/${booking.id}`);
  };
    
  const handlePress = () => {
    router.push(`/booking-details?id=${booking.id}`);
  };

  const bookingImage =
    booking.type === "home cleaning"
      ? require("@/assets/images/sofa.png")
      : require("@/assets/images/table.png");

  const isCancelled = booking.status === "cancelled";

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.system.background.default,
            borderColor: theme.colors.system.border.default,
          },
        ]}
      >
        <View style={styles.leftSection}>
          <View
            style={[
              styles.image,
              { backgroundColor: theme.colors.system.background.secondary },
            ]}
          >
            <Image source={bookingImage} resizeMode="contain" />
          </View>

          <View style={{ gap: 2 }}>
            <Text
              style={[
                styles.title,
                theme.typography.body.md.regular,
                { color: theme.colors.system.body.tertiary },
              ]}
              numberOfLines={1}
            >
              {booking.address}
            </Text>

            <Text
              style={[
                theme.typography.body.sm.regular,
                { color: theme.colors.system.body.disabled },
              ]}
            >
              {booking.date}, {booking.time}
            </Text>

            <Text
              style={[
                theme.typography.body.sm.regular,
                {
                  color: isCancelled
                    ? theme.colors.system.body.error
                    : theme.colors.system.body.disabled,
                },
              ]}
            >
              {isCancelled ? "Cancelled" : booking.total}
            </Text>
          </View>
        </View>

        {!isCancelled && (
          <Button
            variant="outline"
            label="Rebook"
            style={styles.button}
            onPress={handleRebook}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingBottom: 12,
    alignItems: "center",
    borderBottomWidth: 0.25,
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  icon: {
    width: 50,
    height: 40,
    borderRadius: 6,
    resizeMode: "cover",
  },
  rebookButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 999,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  image: {
    width: 65,
    height: 65,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  title: {
    width: "50%",
  },
});
