import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useTheme } from "@/theme/useTheme";
import { useRouter, useLocalSearchParams } from "expo-router";
import InfoRow from "@/components/infoRow";
import { Icon } from "@/constants/icon";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/button";
import StatusPill from "@/components/statusPill";
import { MOCK_BOOKINGS, Booking } from "@/constants/mockBookings";
import CustomerSupport from "@/components/bottomSheet/customerSupport";
import CancelBooking from "@/components/bottomSheet/cancelBooking";

export default function BookingDetails() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [contactVisible, setContactVisible] = React.useState(false);
  const [cancelVisible, setCancelVisible] = React.useState(false);

  // Get the booking from MOCK_BOOKINGS using the id from params
  const booking: Booking | undefined = id
    ? MOCK_BOOKINGS[id as keyof typeof MOCK_BOOKINGS]
    : undefined;

  if (!booking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Booking not found.</Text>
      </View>
    );
  }

  type BookingStatus = "upcoming" | "completed" | "cancelled";

  const statusColorMap: Record<BookingStatus, string> = {
    upcoming: theme.colors.system.background.default,
    completed: theme.colors.system.background.default,
    cancelled: theme.colors.system.background.default,
  };

  const statusColor = statusColorMap[booking.status as BookingStatus];
  return (
    <SafeAreaProvider
      style={[{ backgroundColor: theme.colors.system.background.default }]}
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.system.background.default },
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.wrapper}>
            <Text
              style={[
                theme.typography.heading.xs,
                { color: theme.colors.system.body.default },
              ]}
            >
              {booking.title}
            </Text>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => router.back()}
            >
              <Icon.close color={theme.colors.system.body.default} />
            </TouchableOpacity>
          </View>

          <StatusPill status={booking.status} />
        </View>

        <ScrollView>
          {/* INFO ROWS */}
          <View style={styles.section}>
            <InfoRow
              icon={<Icon.location color={theme.colors.system.body.disabled} />}
              label="Address"
              value={booking.address}
            />

            <InfoRow
              icon={<Icon.calendar color={theme.colors.system.body.disabled} />}
              label="Schedule"
              value={booking.schedule}
            />

            <InfoRow
              icon={<Icon.notes color={theme.colors.system.body.disabled} />}
              label="Details"
              value={booking.details}
            />

            <InfoRow
              icon={<Icon.sparkle color={theme.colors.system.body.disabled} />}
              label="Special Instructions"
              value={booking.instructions}
            />

            <InfoRow
              icon={<Icon.broom color={theme.colors.system.body.disabled} />}
              label="Cleaner"
              value={booking.cleaner}
            />

            <InfoRow
              icon={<Icon.bill color={theme.colors.system.body.disabled} />}
              label="Total"
              value={booking.total}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* BUTTONS */}
      {booking.status === "upcoming" ? (
        <View style={styles.footer}>
          <View style={styles.warningContainer}>
            <Text
              style={[
                theme.typography.body.sm.regular,
                {
                  color: theme.colors.system.body.accent,
                  marginLeft: 8,
                  flex: 1,
                },
              ]}
            >
              You can reschedule or cancel bookings up to 24 hours before the
              appointment time.
            </Text>
          </View>
          <View
            style={[
              styles.btnContainer,
              { backgroundColor: theme.colors.system.background.secondary },
            ]}
          >
            <Button
              style={{ borderColor: theme.colors.button.border.error }}
              textStyle={{ color: theme.colors.button.label.error }}
              variant="outline"
              label="Cancel"
              onPress={() => setCancelVisible(true)}
            />
            <Button variant="outline" label="Reschedule" />
          </View>
        </View>
      ) : (
        <View style={styles.footer}>
          <View
            style={[
              styles.btnContainer,
              { backgroundColor: theme.colors.system.background.secondary },
            ]}
          >
            <Button
              variant="outline"
              label="Customer Support"
              icon={<Icon.help color={theme.colors.button.label.secondary} />}
              iconPosition="left"
              onPress={() => setContactVisible(true)}
            />
          </View>
        </View>
      )}
      <CustomerSupport
        visible={contactVisible}
        onClose={() => setContactVisible(false)}
        onCallPress={() => {
          setContactVisible(false);
          Alert.alert("Calling Support", "+123456789");
        }}
        onWhatsappPress={() => {
          setContactVisible(false);
          Alert.alert("Messaging Support", "Opening chat...");
        }}
      />
      <CancelBooking
        visible={cancelVisible}
        onClose={() => setCancelVisible(false)}
        onCancelPress={() => {
          setCancelVisible(false);
          Alert.alert("Booking Cancelled", "Your booking has been cancelled.");
        }}
        onReschedulePress={() => {
          setCancelVisible(false);
        //   router.push(`/reschedule/${id}`);
        }}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    flexDirection: "column",
    gap: 32,
  },
  wrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    alignContent: "center",
  },

  closeBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "column",
    paddingTop: 16,
  },

  statusPill: {
    alignSelf: "flex-start",
    borderRadius: 20,
    borderWidth: 1,
  },

  section: {
    flexDirection: "column",
    gap: 16,
    // marginBottom: 24,
  },

  warningContainer: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 8,
    alignItems: "flex-start",
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 50,
    alignItems: "center",
  },
  footer: {
    flexDirection: "column",
    gap: 8,
  },
  rescheduleBtn: {
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 50,
    alignItems: "center",
  },
  btnContainer: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    gap: 8,
  },
});
