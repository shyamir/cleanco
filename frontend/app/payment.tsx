import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { useNavigation } from "expo-router";
import { Icon } from "@/constants/icon";
import GradientText from "@/components/gradientText";
import FooterSummary from "@/components/footerSummary";
import useCleaningBooking from "./hooks/useCleaningBooking";
import { useBooking } from "@/context/booking-context";
import PaymentGroup from "@/components/paymentGroup";
import { useRouter } from "expo-router";
import {
  bookingApi,
  ServiceType,
  BookingType,
  PaymentMethod,
  mapFrequencyToBackend,
  CreateBookingRequest,
  CreateSubscriptionRequest,
} from "@/services/bookingService";

const Payment = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();

  const { total, clearPricingCache } = useCleaningBooking();
  const {
    frequency,
    bedrooms,
    bathrooms,
    pet,
    instructions,
    startDate,
    addressId,
    timeSlotId,
    selectedDays,
    paymentMethod,
    promoCode,
    promoDiscount,
    originalTotal,
    resetBooking,
  } = useBooking();

  const [isPaymentValid, setIsPaymentValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    // Validate required fields
    if (!addressId) {
      Alert.alert("Error", "Please select an address before confirming.");
      return;
    }

    if (!timeSlotId) {
      Alert.alert("Error", "Please select a time slot before confirming.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { isSubscription, subscriptionFrequency } = mapFrequencyToBackend(frequency);

      if (isSubscription && subscriptionFrequency) {
        // Create a subscription
        const subscriptionRequest: CreateSubscriptionRequest = {
          serviceType: ServiceType.HOME,
          frequency: subscriptionFrequency,
          addressId,
          timeSlotId,
          selectedDays: selectedDays.length > 0 ? selectedDays : [1], // Default to Monday if no days selected
          bedrooms,
          bathrooms,
          hasPets: pet !== "None",
        };

        await bookingApi.createSubscription(subscriptionRequest);

        // Clear cached pricing rules so they're refetched next time
        clearPricingCache();

        // Navigate to confirmation for subscriptions (payment handled separately)
        router.push("/confirmation");
      } else {
        // Create a one-time booking
        const bookingRequest: CreateBookingRequest = {
          serviceType: ServiceType.HOME,
          bookingType: BookingType.ONE_TIME,
          addressId,
          date: startDate || new Date().toISOString().split("T")[0],
          timeSlotId,
          bedrooms,
          bathrooms,
          hasPets: pet !== "None",
          paymentMethod,
          specialInstructions: instructions || undefined,
          promoCode: promoCode || undefined,
        };

        const booking = await bookingApi.createBooking(bookingRequest);

        // Handle BML payment flow
        if (paymentMethod === PaymentMethod.BML_GATEWAY) {
          // Initiate BML payment
          const bmlResponse = await bookingApi.initiateBmlPayment(booking.id);

          // Clear cached pricing rules
          clearPricingCache();

          // Open BML payment page in external browser
          const canOpen = await Linking.canOpenURL(bmlResponse.paymentUrl);
          if (canOpen) {
            await Linking.openURL(bmlResponse.paymentUrl);
            // User will be redirected back to app via deep link after payment
          } else {
            Alert.alert(
              "Error",
              "Unable to open payment page. Please try again."
            );
          }
        } else {
          // Bank transfer - go directly to confirmation
          clearPricingCache();
          router.push("/confirmation");
        }
      }
    } catch (error: any) {
      console.error("Failed to create booking:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to create booking. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaProvider>
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.system.background.default },
        ]}
      >
        <SafeAreaView style={styles.safeAreaContent} edges={["top"]}>
          <View style={styles.contentWrapper}>
            <Image
              source={require("@/assets/images/payment.png")}
              style={styles.image}
              resizeMode="cover"
            />

            <ScrollView contentContainerStyle={styles.scroll}>
              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Icon.back color={theme.colors.system.body.default} />
              </TouchableOpacity>

              {/* Header */}
              <View style={styles.header}>
                <GradientText
                  text="Payment"
                  colors={theme.colors.system.heading.default}
                  variant={theme.typography.heading.sm}
                />
                <GradientText
                  text="Method"
                  colors={theme.colors.system.heading.default}
                  variant={theme.typography.heading.sm}
                />
                {/* <Text
                  style={[
                    {
                      ...theme.typography.heading.sm,
                      color: theme.colors.system.body.tertiary,
                    } as any,
                  ]}
                >
                  Method
                </Text> */}
              </View>
              <PaymentGroup onValidationChange={setIsPaymentValid} />
            </ScrollView>
          </View>
        </SafeAreaView>

        {/* Footer outside the SafeArea so it sits flush at bottom */}
        <FooterSummary
          total={total}
          frequency={frequency}
          currency="MVR"
          primaryLabel={isSubmitting ? "Processing..." : "Confirm"}
          secondaryLabel="Back"
          onPrimaryPress={handleConfirm}
          onSecondaryPress={() => navigation.goBack()}
          disabledPrimary={!isPaymentValid || isSubmitting}
          originalTotal={originalTotal}
          promoDiscount={promoDiscount}
          promoCode={promoCode}
        />
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeAreaContent: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  image: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "column",
    gap: 8,
    marginBottom: 24,
  },
});

export default Payment;
