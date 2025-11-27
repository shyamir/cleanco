import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";
import Tabs from "@/components/tabs";
import { TABS_DATA } from "@/constants/tabData";
import ActivityCard from "@/components/statusCard/activityCard";
import ActivityRow from "@/components/activityRow";
import { MOCK_BOOKINGS, Booking } from "@/constants/mockBookings";
import { Icon } from "@/constants/icon";
import {
  isUpcomingBooking,
  parseBookingDate,
  isTodayOrTomorrow,
} from "@/utils/date";

export default function Activity() {
const {theme} = useTheme();
  const router = useRouter();

  // All upcoming bookings (for grouping)
  const allUpcomingBookings = Object.values(MOCK_BOOKINGS).filter((b) =>
    isUpcomingBooking(b.date, b.time)
  );

  // Sort them
  allUpcomingBookings.sort(
    (a, b) =>
      parseBookingDate(a.date, a.time).getTime() -
      parseBookingDate(b.date, b.time).getTime()
  );

  // Next booking (ActivityCard) only if today/tomorrow
  const nextBooking = allUpcomingBookings.find((b) =>
    isTodayOrTomorrow(b.date, b.time)
  );

  // Group all upcoming bookings by date for ActivityRow
  const bookingsByDate: Record<string, Booking[]> = {};
  allUpcomingBookings.forEach((b) => {
    if (!bookingsByDate[b.date]) bookingsByDate[b.date] = [];
    bookingsByDate[b.date].push(b);
  });

  const hasUpcoming = allUpcomingBookings.length > 0;

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.system.background.default },
        ]}
      >
        <View style={styles.header}>
          <Text
            style={[
              {
                ...theme.typography.heading.xs,
                color: theme.colors.system.body.tertiary,
              },
            ]}
          >
            Activity
          </Text>
          <TouchableOpacity
            style={styles.historyIcon}
            onPress={() => router.push("/history")}
          >
            <Icon.history color={theme.colors.system.body.default} />
          </TouchableOpacity>
        </View>

        {!hasUpcoming ? (
          <View style={styles.emptyState}>
            <Image
              source={require("@/assets/images/empty-bookings.png")}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text
              style={{
                ...theme.typography.body.md.regular,
                color: theme.colors.system.body.disabled,
              }}
            >
              You have no upcoming bookings
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.body}>
              {nextBooking && <ActivityCard booking={nextBooking} />}
            </View>

            {/* Remaining upcoming bookings grouped by date */}
            {Object.keys(bookingsByDate).map((date) => (
              <View
                key={date}
                style={[
                  styles.group,
                  { borderColor: theme.colors.system.border.default },
                ]}
              >
                <Text
                  style={{
                    ...theme.typography.body.md.medium,
                    color: theme.colors.system.body.default,
                  }}
                >
                  {date}
                </Text>

                <View style={styles.actContainer}>
                  {bookingsByDate[date].map((booking) => (
                    <ActivityRow key={booking.id} booking={booking} />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        <Tabs tabs={TABS_DATA} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    flexDirection: "column",
    gap: 16,
  },
  historyIcon: {
    width: 48,
    height: 48,
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    justifyContent: "space-between",
    flexDirection: "row",
    // paddingTop: 16,
    gap: 8,
    height: 48,
    alignContent: "center",
    alignItems: "center",
  },
  body: { flexDirection: "column", gap: 0 },
  scrollContainer: { flexGrow: 1, paddingBottom: 80, gap: 8 },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  emptyImage: { height: 200, opacity: 0.5, resizeMode: "contain" },
  group: {
    flexDirection: "column",
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  actContainer: { flexDirection: "column", gap: 16 },
});
