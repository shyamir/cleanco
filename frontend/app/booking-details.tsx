import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter, useLocalSearchParams } from "expo-router";
import InfoRow from "@/components/infoRow";
import { Icon } from "@/constants/icon";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/button";
import StatusPill from "@/components/statusPill";
import CustomerSupport from "@/components/bottomSheet/customerSupport";
import CancelBooking from "@/components/bottomSheet/cancelBooking";
import RescheduleBooking from "@/components/bottomSheet/rescheduleBooking";
import { bookingApi, BookingDetails, ServiceType } from "@/services/bookingService";
import { useActivity } from "@/context/activity-context";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

// Map backend status to frontend status pill
// Also considers booking date - past bookings that aren't CANCELED show as completed
// PENDING_INSPECTION status shows as "quote"
const mapStatus = (
  backendStatus: string,
  bookingDate: string
): "upcoming" | "completed" | "cancelled" | "pending" | "quote" => {
  // Cancelled bookings always show as cancelled
  if (backendStatus === "CANCELED") {
    return "cancelled";
  }

  // Completed bookings always show as completed
  if (backendStatus === "COMPLETED") {
    return "completed";
  }

  // Check if booking date is in the past
  const isPastBooking = dayjs.utc(bookingDate).isBefore(dayjs().startOf("day"));
  if (isPastBooking) {
    return "completed";
  }

  // Future bookings show based on status
  switch (backendStatus) {
    case "PENDING":
      return "pending";
    case "PENDING_INSPECTION":
      return "quote";
    case "CONFIRMED":
    case "ASSIGNED":
    case "IN_PROGRESS":
      return "upcoming";
    default:
      return "upcoming";
  }
};

// Check if booking can be modified (reschedule/cancel)
// Must have modifiable status AND be in the future
const canModifyBooking = (status: string, bookingDate: string): boolean => {
  const isModifiableStatus = ["PENDING", "PENDING_INSPECTION", "CONFIRMED", "ASSIGNED"].includes(status);
  const isFutureBooking = dayjs.utc(bookingDate).isAfter(dayjs().startOf("day"));
  return isModifiableStatus && isFutureBooking;
};

// Get current time in Maldives timezone (UTC+5)
const getMaldivesNow = () => {
  const MALDIVES_OFFSET_HOURS = 5;
  return dayjs.utc().add(MALDIVES_OFFSET_HOURS, 'hour');
};

// Check if booking is within 24 hours (for refund policy)
const isBookingWithin24Hours = (bookingDate: string, startTime: string): boolean => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const bookingDateTime = dayjs.utc(bookingDate)
    .hour(hours)
    .minute(minutes)
    .second(0);
  const hoursDiff = bookingDateTime.diff(getMaldivesNow(), 'hour');
  return hoursDiff < 24;
};

export default function BookingDetailsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { refreshBookings } = useActivity();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contactVisible, setContactVisible] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [rescheduleVisible, setRescheduleVisible] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) {
        setError("No booking ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const data = await bookingApi.getBookingById(id as string);
        setBooking(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load booking");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaProvider
        style={[{ backgroundColor: theme.colors.system.background.default }]}
      >
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors.system.body.default}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaProvider
        style={[{ backgroundColor: theme.colors.system.background.default }]}
      >
        <SafeAreaView style={styles.errorContainer}>
          <Text
            style={[
              theme.typography.body.md.regular,
              { color: theme.colors.system.body.default },
            ]}
          >
            {error || "Booking not found"}
          </Text>
          <Button
            variant="outline"
            label="Go Back"
            onPress={() => router.back()}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Build display values
  const isHomeService = booking.serviceType === ServiceType.HOME;
  const serviceTitle = isHomeService ? "Home Cleaning" : "Office Cleaning";

  // Build full address: prefer snapshot data for historical accuracy
  const addressParts = [
    booking.addressLabel ?? booking.address?.label,
    booking.addressAddress ?? booking.address?.address,
    booking.addressStreet ?? booking.address?.street,
    booking.addressLandmark ?? booking.address?.landmark,
  ].filter(Boolean);
  const displayAddress = addressParts.join(", ");

  const formattedDate = dayjs.utc(booking.date).format("D MMM YYYY");
  const formattedTime = booking.timeSlot.displayStartTime;
  const scheduleDisplay = `${formattedDate}, ${formattedTime}`;

  // Build details string
  let detailsDisplay = "";
  if (isHomeService) {
    const bedroomText = booking.bedrooms
      ? `${booking.bedrooms} bedroom${booking.bedrooms > 1 ? "s" : ""}`
      : "";
    const bathroomText = booking.bathrooms
      ? `${booking.bathrooms} bathroom${booking.bathrooms > 1 ? "s" : ""}`
      : "";
    const petText = booking.hasPets ? "Has pets" : "No pets";
    detailsDisplay = [bedroomText, bathroomText, petText]
      .filter(Boolean)
      .join(", ");
  } else {
    const sqftText = booking.squareFeet ? `${booking.squareFeet} sqft` : "";
    const roomText = booking.rooms
      ? `${booking.rooms} room${booking.rooms > 1 ? "s" : ""}`
      : "";
    const toiletText = booking.toilets
      ? `${booking.toilets} toilet${booking.toilets > 1 ? "s" : ""}`
      : "";
    detailsDisplay = [sqftText, roomText, toiletText].filter(Boolean).join(", ");
  }

  // Handle price display for office bookings (estimated vs confirmed)
  let priceDisplay = `MVR ${booking.finalPrice}`;
  let priceLabel = "Total";
  if (!isHomeService) {
    if (booking.confirmedPrice !== null && booking.confirmedPrice !== undefined) {
      priceDisplay = `MVR ${booking.confirmedPrice}`;
      priceLabel = "Confirmed Price";
    } else if (booking.estimatedPrice !== null && booking.estimatedPrice !== undefined) {
      // Use finalPrice for estimated display as it includes promo discount
      priceDisplay = `MVR ${booking.finalPrice} (Est.)`;
      priceLabel = "Estimated Price";
    }
  }
  const status = mapStatus(booking.status, booking.date);
  const showModifyButtons = canModifyBooking(booking.status, booking.date);
  const within24Hours = isBookingWithin24Hours(booking.date, booking.timeSlot.startTime);

  const handleCancelBooking = async () => {
    setCancelVisible(false);
    setIsProcessing(true);
    try {
      await bookingApi.cancelBooking(booking.id);
      refreshBookings();
      Alert.alert("Booking Cancelled", "Your booking has been cancelled.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to cancel booking"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRescheduleBooking = async (date: string, timeSlotId: string) => {
    setRescheduleVisible(false);
    setIsProcessing(true);
    try {
      await bookingApi.rescheduleBooking(booking.id, date, timeSlotId);
      refreshBookings();
      Alert.alert("Booking Rescheduled", "Your booking has been rescheduled.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to reschedule booking"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaProvider
      style={[{ backgroundColor: theme.colors.system.background.default }]}
    >
      {/* Processing overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.system.body.default} />
        </View>
      )}

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
              {serviceTitle}
            </Text>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => router.back()}
            >
              <Icon.close color={theme.colors.system.body.default} />
            </TouchableOpacity>
          </View>

          <StatusPill status={status} />
        </View>

        <ScrollView>
          {/* INFO ROWS */}
          <View style={styles.section}>
            <InfoRow
              icon={<Icon.list color={theme.colors.system.body.disabled} />}
              label="Booking ID"
              value={booking.bookingNumber}
            />

            <InfoRow
              icon={<Icon.location color={theme.colors.system.body.disabled} />}
              label="Address"
              value={displayAddress}
            />

            <InfoRow
              icon={<Icon.calendar color={theme.colors.system.body.disabled} />}
              label="Schedule"
              value={scheduleDisplay}
            />

            <InfoRow
              icon={<Icon.notes color={theme.colors.system.body.disabled} />}
              label="Details"
              value={detailsDisplay || "-"}
            />

            <InfoRow
              icon={<Icon.sparkle color={theme.colors.system.body.disabled} />}
              label="Special Instructions"
              value={booking.specialInstructions || "-"}
            />

            <InfoRow
              icon={<Icon.bill color={theme.colors.system.body.disabled} />}
              label={priceLabel}
              value={priceDisplay}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* BUTTONS */}
      {showModifyButtons ? (
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
              {within24Hours
                ? "Cancellations within 24 hours of the appointment are not eligible for refunds."
                : "You can reschedule or cancel this booking. Cancellations within 24 hours are not eligible for refunds."}
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
            <Button
              variant="outline"
              label="Reschedule"
              onPress={() => setRescheduleVisible(true)}
            />
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
        onCancelPress={handleCancelBooking}
        onReschedulePress={() => {
          setCancelVisible(false);
          setRescheduleVisible(true);
        }}
        isWithin24Hours={within24Hours}
      />
      <RescheduleBooking
        visible={rescheduleVisible}
        onClose={() => setRescheduleVisible(false)}
        onConfirmPress={handleRescheduleBooking}
        onCancelPress={() => setRescheduleVisible(false)}
        serviceName={serviceTitle}
        bedrooms={booking.bedrooms}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
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
  section: {
    flexDirection: "column",
    gap: 16,
  },
  warningContainer: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 8,
    alignItems: "flex-start",
    marginTop: 8,
  },
  footer: {
    flexDirection: "column",
    gap: 8,
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
