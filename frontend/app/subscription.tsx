import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";
import { Icon } from "@/constants/icon";
import SubscriptionCard from "@/components/card/subscriptionCard";
import {
  bookingApi,
  Subscription,
  SubscriptionFrequency,
  ServiceType,
} from "@/services/bookingService";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

// Get current date in Maldives timezone (UTC+5, no daylight saving)
const getMaldivesNow = () => {
  const MALDIVES_OFFSET_HOURS = 5;
  return dayjs.utc().add(MALDIVES_OFFSET_HOURS, 'hour');
};

// Check if a date is in the past (in Maldives timezone)
const isDateInPast = (dateString: string | undefined): boolean => {
  if (!dateString) return false;
  const date = dayjs.utc(dateString);
  const today = getMaldivesNow().startOf('day');
  return date.isBefore(today);
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatFrequency = (frequency: SubscriptionFrequency): string => {
  switch (frequency) {
    case SubscriptionFrequency.ONCE_A_WEEK:
      return "1x per week";
    case SubscriptionFrequency.TWICE_A_WEEK:
      return "2x per week";
    case SubscriptionFrequency.THRICE_A_WEEK:
      return "3x per week";
    default:
      return frequency;
  }
};

const formatAddress = (subscription: Subscription): string => {
  // Prefer snapshot data for historical accuracy
  const address = subscription.addressAddress ?? subscription.address?.address;
  const street = subscription.addressStreet ?? subscription.address?.street;
  const landmark = subscription.addressLandmark ?? subscription.address?.landmark;

  const parts = [address, street, landmark].filter(Boolean);
  return parts.join(", ") || "Address not available";
};

const formatDays = (selectedDays: number[]): string => {
  if (!selectedDays || selectedDays.length === 0) return "Not set";
  return selectedDays
    .sort((a, b) => a - b)
    .map((day) => DAY_NAMES[day])
    .join(", ");
};

const formatTimeFromString = (startTime: string): string => {
  // Convert 24h format to 12h format
  const [hours, minutes] = startTime.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const formatTime = (timeSlot: Subscription["timeSlot"] | undefined): string => {
  if (!timeSlot) return "Not set";
  return formatTimeFromString(timeSlot.startTime);
};

// Format day slots with their times (e.g., "Mon 9:00 AM, Wed 2:00 PM")
const formatDaySlots = (subscription: Subscription): string => {
  // Use daySlots if available
  if (subscription.daySlots && subscription.daySlots.length > 0) {
    return subscription.daySlots
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
      .map((slot) => {
        const dayName = DAY_NAMES[slot.dayOfWeek];
        const time = formatTimeFromString(slot.timeSlot.startTime);
        return `${dayName} ${time}`;
      })
      .join("\n");
  }

  // Fallback to old format (selectedDays + single timeSlot)
  if (subscription.selectedDays && subscription.timeSlot) {
    const time = formatTime(subscription.timeSlot);
    return subscription.selectedDays
      .sort((a, b) => a - b)
      .map((day) => `${DAY_NAMES[day]} ${time}`)
      .join("\n");
  }

  return "Not set";
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";
  return dayjs.utc(dateString).format("MMM D, YYYY");
};

const getServiceTitle = (serviceType: ServiceType): string => {
  return serviceType === ServiceType.HOME ? "Home Cleaning" : "Office Cleaning";
};

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookingApi.getUserSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      setError("Failed to load subscriptions. Please try again.");
      console.error("Error fetching subscriptions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleCancel = (subscription: Subscription) => {
    Alert.alert(
      "Cancel Subscription",
      `Are you sure you want to cancel your ${getServiceTitle(subscription.serviceType).toLowerCase()} subscription?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await bookingApi.cancelSubscription(subscription.id);
              Alert.alert("Success", "Subscription cancelled successfully.");
              fetchSubscriptions();
            } catch (err) {
              Alert.alert("Error", "Failed to cancel subscription. Please try again.");
              console.error("Error cancelling subscription:", err);
            }
          },
        },
      ]
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.system.body.default} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[theme.typography.body.md, { color: theme.colors.system.body.default, textAlign: "center" }]}>
            {error}
          </Text>
          <TouchableOpacity onPress={fetchSubscriptions} style={styles.retryButton}>
            <Text style={[theme.typography.body.md, { color: theme.colors.button.label.primary }]}>
              Tap to retry
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (subscriptions.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[theme.typography.body.md, { color: theme.colors.system.body.disabled, textAlign: "center" }]}>
            You don't have any subscriptions yet.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {subscriptions.map((subscription) => {
          const isCanceled = subscription.status === "CANCELED";
          const startDateValue = subscription.bookings?.[0]?.date || subscription.startDate;
          const endDateValue = isCanceled ? subscription.endDate : subscription.nextBillingDate;

          // Determine labels based on whether dates are in the past
          const startLabel = isDateInPast(startDateValue) ? "Started" : "Starts";
          const endLabel = isCanceled
            ? (isDateInPast(endDateValue) ? "Ended" : "Ends")
            : "Next Renewal";

          return (
            <SubscriptionCard
              key={subscription.id}
              subscriptionId={subscription.id}
              type={subscription.serviceType === ServiceType.HOME ? "home" : "office"}
              title={getServiceTitle(subscription.serviceType)}
              address={formatAddress(subscription)}
              frequency={formatFrequency(subscription.frequency)}
              days={formatDays(subscription.selectedDays)}
              time={formatDaySlots(subscription)}
              price={`MVR ${subscription.monthlyPrice}/month`}
              startDate={formatDate(startDateValue)}
              startLabel={startLabel}
              renewalOrEndDate={formatDate(endDateValue)}
              renewalOrEndLabel={endLabel}
              status={subscription.status}
              onCancel={() => handleCancel(subscription)}
            />
          );
        })}
      </ScrollView>
    );
  };

  return (
    <SafeAreaProvider>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <SafeAreaView
          style={[
            styles.container,
            { backgroundColor: theme.colors.system.background.default },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.push("/account")}
              style={styles.backBtn}
            >
              <Icon.back color={theme.colors.system.body.default} />
            </TouchableOpacity>

            <Text
              style={[
                theme.typography.heading.xs,
                { color: theme.colors.system.body.default, marginBottom: 24 },
              ]}
            >
              Subscriptions
            </Text>
          </View>

          {renderContent()}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  scrollContainer: { flexGrow: 1, gap: 12, paddingBottom: 24 },
  backBtn: { width: 32, height: 32, justifyContent: "center", marginBottom: 8 },
  header: { flexDirection: "column", gap: 8 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  retryButton: { marginTop: 16, padding: 12 },
});
