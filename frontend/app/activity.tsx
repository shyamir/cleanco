import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import Tabs from "@/components/tabs";
import { TABS_DATA } from "@/constants/tabData";
import ActivityCard from "@/components/statusCard/activityCard";
import ActivityRow from "@/components/activityRow";
import { Icon } from "@/constants/icon";
import { useActivity } from "@/context/activity-context";
import { ActivityBooking } from "@/services/bookingService";

dayjs.extend(utc);

export default function Activity() {
  const { theme } = useTheme();
  const router = useRouter();
  const { upcomingBookings, quotes, isLoading, isRefreshing, refreshBookings } =
    useActivity();

  const quotesCount = quotes.length;

  // Check if booking is today or tomorrow
  const isTodayOrTomorrow = (dateStr: string): boolean => {
    const bookingDate = dayjs.utc(dateStr);
    const today = dayjs().startOf("day");
    const tomorrow = today.add(1, "day");
    return bookingDate.isSame(today, "day") || bookingDate.isSame(tomorrow, "day");
  };

  // Get first booking that is today or tomorrow for the featured card
  const nextBooking = upcomingBookings.find((b) => isTodayOrTomorrow(b.date));

  // Group all upcoming bookings by date and sort by time within each group
  const bookingsByDate: Record<string, ActivityBooking[]> = {};
  upcomingBookings.forEach((b) => {
    const dateKey = dayjs.utc(b.date).format("D MMM YYYY");
    if (!bookingsByDate[dateKey]) bookingsByDate[dateKey] = [];
    bookingsByDate[dateKey].push(b);
  });

  // Sort bookings within each date group by time slot start time (ascending)
  Object.keys(bookingsByDate).forEach((dateKey) => {
    bookingsByDate[dateKey].sort((a, b) =>
      a.timeSlot.startTime.localeCompare(b.timeSlot.startTime)
    );
  });

  const hasUpcoming = upcomingBookings.length > 0;

  if (isLoading) {
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
            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push("/quotes")}
              >
                <Icon.bill color={theme.colors.system.body.default} />
                {quotesCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.colors.pill.background.warning }]}>
                    <Text style={[styles.badgeText, { color: theme.colors.pill.label.warning }]}>
                      {quotesCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push("/history")}
              >
                <Icon.history color={theme.colors.system.body.default} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme.colors.system.body.default}
            />
          </View>
          <Tabs tabs={TABS_DATA} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

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
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/quotes")}
            >
              <Icon.bill color={theme.colors.system.body.default} />
              {quotesCount > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.colors.pill.background.warning }]}>
                  <Text style={[styles.badgeText, { color: theme.colors.pill.label.warning }]}>
                    {quotesCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/history")}
            >
              <Icon.history color={theme.colors.system.body.default} />
            </TouchableOpacity>
          </View>
        </View>

        {!hasUpcoming ? (
          <ScrollView
            contentContainerStyle={styles.emptyState}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshBookings}
                tintColor={theme.colors.system.body.default}
              />
            }
          >
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
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshBookings}
                tintColor={theme.colors.system.body.default}
              />
            }
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
  header: {
    justifyContent: "space-between",
    flexDirection: "row",
    gap: 8,
    height: 48,
    alignContent: "center",
    alignItems: "center",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  body: { flexDirection: "column", gap: 0 },
  scrollContainer: { flexGrow: 1, paddingBottom: 80, gap: 8 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
