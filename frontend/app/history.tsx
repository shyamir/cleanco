import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";
import { MOCK_BOOKINGS } from "@/constants/mockBookings";
import { isPastBooking } from "@/utils/date";
import HistoryRow from "@/components/historyRow"; // 👈 updated import
import { Icon } from "@/constants/icon";

export default function History() {
const {theme} = useTheme();
  const router = useRouter();

  // Filter past bookings
  const pastBookings = Object.values(MOCK_BOOKINGS).filter((b) =>
    isPastBooking(b.date, b.time)
  );

  const hasHistory = pastBookings.length > 0;

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.system.background.default },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/activity")}>
            <Icon.back color={theme.colors.system.body.default} />
          </TouchableOpacity>

          <Text
            style={[
              {
                ...theme.typography.heading.xs,
                color: theme.colors.system.body.tertiary,
              },
            ]}
          >
            History
          </Text>
        </View>

        {/* Empty State */}
        {!hasHistory ? (
          <View style={styles.emptyState}>
            <Image
              source={require("@/assets/images/empty-bookings.png")}
              style={styles.emptyImage}
            />
            <Text
              style={{
                ...theme.typography.body.md.regular,
                color: theme.colors.system.body.disabled,
              }}
            >
              You have no previous bookings
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {pastBookings.map((booking) => (
              <HistoryRow key={booking.id} booking={booking} />
            ))}
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16, },
  header: {
    flexDirection: "column",
    gap: 12,
    paddingVertical: 16,

  },
  list: { flexDirection: "column", gap: 16 },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  emptyImage: {
    height: 200,
    opacity: 0.5,
    resizeMode: "contain",
  },
});
