import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import GradientText from "../components/gradientText";
import { useNavigation, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Button from "../components/button";
import { Icon } from "@/constants/icon";
import InfoRow from "../components/infoRow";
import PromoCodeInput from "../components/promoCodeInput";
import { useAddress } from "../context/address-context";
import { useBooking } from "@/context/booking-context";
import useCleaningBooking from "./hooks/useCleaningBooking";
import { promoApi } from "@/services/promoService";
import {
  bookingApi,
  ServiceType,
  BookingType,
  PaymentMethod,
  mapFrequencyToBackend,
  CreateBookingRequest,
  CreateSubscriptionRequest,
  CheckoutSessionResponse,
} from "@/services/bookingService";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const Review = () => {
  const { theme } = useTheme();
  const router = useRouter();

  const navigation = useNavigation();
  const { selected } = useAddress();
  const {
    pet,
    otherPet,
    frequency,
    schedule,
    setSchedule,
    instructions,
    startDate,
    service,
    promoCode,
    setPromoCode,
    promoDiscount,
    setPromoDiscount,
    promoDiscountType,
    setPromoDiscountType,
    promoDiscountValue,
    setPromoDiscountValue,
    originalTotal,
    setOriginalTotal,
    setTotal,
    // Office-specific fields
    squareFeet,
    rooms,
    toilets,
    isEstimate,
    setIsEstimate,
    // Fields needed for booking creation
    addressId,
    timeSlotId,
    daySlots,
    // Checkout session
    setCheckoutSession,
  } = useBooking();
  const { bedrooms, bathrooms, total: homeCleaningTotal, slots } = useCleaningBooking();

  // Determine if this is an office booking
  const isOfficeBooking = service === "Office Cleaning";

  // State for loading office quote - use LOCAL state to avoid useCleaningBooking overwriting
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [officeTotal, setOfficeTotal] = useState<number | null>(null);
  // State for submitting office quote
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State for creating checkout session (home cleaning)
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  // Use correct total based on service type
  // For office: use local officeTotal state (not affected by useCleaningBooking)
  // For home: use homeCleaningTotal from useCleaningBooking hook
  const total = isOfficeBooking ? (officeTotal ?? 0) : homeCleaningTotal;

  // Fetch office quote only when review page is focused (prevents fetching when screen is in background)
  useFocusEffect(
    useCallback(() => {
      if (!isOfficeBooking) return;

      const fetchOfficeQuote = async () => {
        setIsLoadingQuote(true);
        setQuoteError(null);

        try {
          const { subscriptionFrequency } = mapFrequencyToBackend(frequency);
          const response = await bookingApi.calculateQuote({
            serviceType: ServiceType.OFFICE,
            squareFeet,
            rooms,
            toilets,
            frequency: subscriptionFrequency,
            promoCode: promoCode || undefined,
          });

          // Use local state for office total to avoid useCleaningBooking overwriting it
          setOfficeTotal(response.pricing.finalPrice);
          // Also update booking context for payment flow
          setTotal(response.pricing.finalPrice);
          setIsEstimate(response.isEstimate ?? true);

          // Store original total for promo calculations
          if (response.pricing.discount > 0) {
            setOriginalTotal(response.pricing.basePrice);
            setPromoDiscount(response.pricing.discount);
          }
        } catch (error: any) {
          console.error("Failed to fetch office quote:", error);
          setQuoteError("Failed to calculate quote. Please try again.");
        } finally {
          setIsLoadingQuote(false);
        }
      };

      fetchOfficeQuote();
    }, [isOfficeBooking, squareFeet, rooms, toilets, frequency])
  );

  // Local state for promo validation
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [hasAutoValidated, setHasAutoValidated] = useState(false);

  // Auto-validate promo code on mount if one exists
  useEffect(() => {
    if (promoCode && !hasAutoValidated && total > 0) {
      setHasAutoValidated(true);
      handleApplyPromo(promoCode);
    }
  }, [promoCode, total, hasAutoValidated]);

  const handleApplyPromo = async (code: string) => {
    setHasAutoValidated(true); // Prevent auto-validate effect from running
    setIsValidatingPromo(true);
    setPromoError(null);

    try {
      const serviceType = service === "Home Cleaning" ? "HOME" : "OFFICE";
      const basePrice = originalTotal > 0 ? originalTotal : total;

      const result = await promoApi.validatePromo(code, serviceType, basePrice);

      if (result.valid) {
        setPromoCode(code);
        setPromoDiscountType(result.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT');
        setPromoDiscountValue(result.discountValue);
        setPromoDiscount(result.discount);

        // Store original total if not already stored
        if (originalTotal === 0) {
          setOriginalTotal(basePrice);
        }

        // Update total with discount
        const newTotal = Math.max(0, basePrice - result.discount);
        setTotal(newTotal);
        // Also update local office total for display
        if (isOfficeBooking) {
          setOfficeTotal(newTotal);
        }
      } else {
        setPromoError(result.message || "Invalid promo code");
        // Clear promo state if validation fails
        setPromoCode(null);
        setPromoDiscount(0);
        setPromoDiscountType(null);
        setPromoDiscountValue(0);
      }
    } catch (error: any) {
      setPromoError(
        error.response?.data?.message || "Failed to validate promo code"
      );
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleClearPromo = () => {
    setPromoCode(null);
    setPromoDiscount(0);
    setPromoDiscountType(null);
    setPromoDiscountValue(0);
    setPromoError(null);
    if (originalTotal > 0) {
      setTotal(originalTotal);
      // Also restore local office total for display
      if (isOfficeBooking) {
        setOfficeTotal(originalTotal);
      }
      setOriginalTotal(0);
    }
  };

  // Submit office quote - creates booking with PENDING_INSPECTION status
  const handleSubmitQuote = async () => {
    // Validate required fields
    if (!addressId) {
      Alert.alert("Error", "Please select an address before submitting.");
      return;
    }

    const { isSubscription, subscriptionFrequency } = mapFrequencyToBackend(frequency);

    // For subscriptions, check daySlots; for one-time bookings, check timeSlotId
    if (isSubscription && daySlots.length === 0) {
      Alert.alert("Error", "Please select days and time slots before submitting.");
      return;
    }
    if (!isSubscription && !timeSlotId) {
      Alert.alert("Error", "Please select a time slot before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSubscription && subscriptionFrequency) {
        // Create a subscription for office cleaning
        const subscriptionRequest: CreateSubscriptionRequest = {
          serviceType: ServiceType.OFFICE,
          frequency: subscriptionFrequency,
          addressId,
          daySlots: daySlots.length > 0 ? daySlots : [{ day: 1, timeSlotId: timeSlotId! }],
          squareFeet,
          rooms,
          toilets,
          hasPets: pet !== "None",
          specialInstructions: instructions || undefined,
          promoCode: promoCode || undefined,
        };

        await bookingApi.createSubscription(subscriptionRequest);
      } else {
        // Create a one-time office booking
        const bookingRequest: CreateBookingRequest = {
          serviceType: ServiceType.OFFICE,
          bookingType: BookingType.ONE_TIME,
          addressId,
          date: startDate || new Date().toISOString().split("T")[0],
          timeSlotId: timeSlotId!,
          squareFeet,
          rooms,
          toilets,
          hasPets: pet !== "None",
          paymentMethod: PaymentMethod.BANK_TRANSFER, // Placeholder - payment after inspection
          specialInstructions: instructions || undefined,
          promoCode: promoCode || undefined,
        };

        await bookingApi.createBooking(bookingRequest);
      }

      // Navigate to confirmation page
      router.push("/confirmation");
    } catch (error: any) {
      console.error("Failed to submit quote:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to submit quote. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create checkout session and navigate to payment (home cleaning)
  const handleConfirmAndPay = async () => {
    // Validate required fields
    if (!addressId) {
      Alert.alert("Error", "Please select an address before proceeding to payment.");
      return;
    }

    const { isSubscription, subscriptionFrequency } = mapFrequencyToBackend(frequency);

    if (isSubscription && daySlots.length === 0) {
      Alert.alert("Error", "Please select days and time slots before proceeding to payment.");
      return;
    }

    if (!isSubscription && !timeSlotId) {
      Alert.alert("Error", "Please select a time slot before proceeding to payment.");
      return;
    }

    setIsCreatingCheckout(true);

    try {
      let session: CheckoutSessionResponse;

      if (isSubscription && subscriptionFrequency) {
        // Create subscription checkout
        const request: CreateSubscriptionRequest = {
          serviceType: ServiceType.HOME,
          frequency: subscriptionFrequency,
          addressId,
          daySlots: daySlots.length > 0 ? daySlots : [{ day: 1, timeSlotId: timeSlotId! }],
          startDate: startDate || undefined,
          bedrooms,
          bathrooms,
          hasPets: pet !== "None",
          specialInstructions: instructions || undefined,
          promoCode: promoCode || undefined,
        };
        session = await bookingApi.createSubscriptionCheckout(request);
      } else {
        // Create booking checkout
        const request: CreateBookingRequest = {
          serviceType: ServiceType.HOME,
          bookingType: BookingType.ONE_TIME,
          addressId,
          date: startDate || new Date().toISOString().split("T")[0],
          timeSlotId: timeSlotId!,
          bedrooms,
          bathrooms,
          hasPets: pet !== "None",
          paymentMethod: PaymentMethod.BANK_TRANSFER, // Placeholder - will be set on payment page
          specialInstructions: instructions || undefined,
          promoCode: promoCode || undefined,
        };
        session = await bookingApi.createBookingCheckout(request);
      }

      // Store session in context and navigate to payment
      setCheckoutSession(session);
      router.push("/payment");
    } catch (error: any) {
      console.error("Failed to create checkout session:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to reserve your time slot. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const petDisplay =
    pet && pet !== "None" ? (pet === "Other" ? otherPet : pet) : "No Pets";

  const bedroomCount = Number(bedrooms);
  const bathroomCount = Number(bathrooms);

  let scheduleDisplay = "-";

  if (frequency === "Once") {
    if (schedule) {
      // schedule contains "YYYY-MM-DD, HH:mm" or similar
      const [datePart, timePart] = schedule.split(",");
      const formattedDate = dayjs.utc(datePart).format("D MMM YYYY");
      scheduleDisplay = timePart
        ? `${formattedDate},${timePart}`
        : formattedDate;
    } else {
      scheduleDisplay = "-";
    }
  } else {
    const start = startDate
      ? `Starts: ${
          dayjs.utc(startDate).format("D MMM YYYY") + " (" + frequency + ")"
        }`
      : "";
    const repeat = schedule ? `\n${schedule}` : "";
    scheduleDisplay = `${start}${repeat}`.trim() || "-";
  }
  return (
    <LinearGradient
      colors={theme.colors.system.background.tertiary}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back-outline"
              size={24}
              color={theme.colors.system.heading.active}
            />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <GradientText
              text="Review"
              colors={theme.colors.system.heading.secondary}
              variant={theme.typography.heading.md}
            />
            <Text
              style={[
                {
                  ...theme.typography.heading.md,
                  color: theme.colors.system.heading.active,
                } as any,
              ]}
            >
              Booking
            </Text>
            <Image
              source={require("@/assets/images/review.png")}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.system.background.default },
          ]}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <InfoRow
              icon={<Icon.sparkle color={theme.colors.system.body.disabled} />}
              label="Service"
              value={service}
            />
            <InfoRow
              icon={<Icon.location color={theme.colors.system.body.disabled} />}
              label="Address"
              value={selected?.label + ", " + selected?.address || "-"}
            />

            <InfoRow
              icon={<Icon.calendar color={theme.colors.system.body.disabled} />}
              label={frequency === "Once" ? "Date" : "Schedule"}
              value={scheduleDisplay}
            />
            <InfoRow
              icon={<Icon.notes color={theme.colors.system.body.disabled} />}
              label="Details"
              value={
                isOfficeBooking
                  ? `${squareFeet} sqft, ${rooms} room${rooms > 1 ? "s" : ""}, ${toilets} toilet${toilets > 1 ? "s" : ""}, ${petDisplay}`
                  : `${bedroomCount} bedroom${bedroomCount > 1 ? "s" : ""}, ${bathroomCount} bathroom${bathroomCount > 1 ? "s" : ""}, ${petDisplay}`
              }
            />
            <InfoRow
              icon={<Icon.notes color={theme.colors.system.body.disabled} />}
              label="Special Instructions"
              value={instructions || "-"}
            />
          </ScrollView>

          {/* Promo Code Input */}
          <View style={styles.promoContainer}>
            <PromoCodeInput
              value={promoCode || ""}
              onApply={handleApplyPromo}
              onClear={handleClearPromo}
              isApplied={!!promoCode && promoDiscount > 0}
              isLoading={isValidatingPromo}
              error={promoError}
              discount={promoDiscount}
              discountType={promoDiscountType}
              discountValue={promoDiscountValue}
            />
          </View>

          {/* Total + Message */}
          <View style={styles.totalContainerWrapper}>
            {/* Show subtotal if discount applied */}
            {promoCode && promoDiscount > 0 && originalTotal > 0 && (
              <View style={styles.discountRow}>
                <Text
                  style={
                    [
                      theme.typography.body.md.regular,
                      { color: theme.colors.system.body.disabled },
                    ] as any
                  }
                >
                  Subtotal
                </Text>
                <Text
                  style={
                    [
                      theme.typography.body.md.regular,
                      { color: theme.colors.system.body.disabled },
                    ] as any
                  }
                >
                  {originalTotal} MVR
                </Text>
              </View>
            )}

            {/* Show discount if applied */}
            {promoCode && promoDiscount > 0 && (
              <View style={styles.discountRow}>
                <Text
                  style={
                    [
                      theme.typography.body.md.regular,
                      { color: theme.colors.input.label.success },
                    ] as any
                  }
                >
                  Discount ({promoCode})
                </Text>
                <Text
                  style={
                    [
                      theme.typography.body.md.regular,
                      { color: theme.colors.input.label.success },
                    ] as any
                  }
                >
                  -{promoDiscountType === "PERCENTAGE"
                    ? `${promoDiscountValue}%`
                    : `${promoDiscount} MVR`}
                </Text>
              </View>
            )}

            <View style={styles.totalContainer}>
              <View>
                <Text
                  style={
                    [
                      theme.typography.heading.xs2,
                      { color: theme.colors.system.body.default },
                    ] as any
                  }
                >
                  {isOfficeBooking && isEstimate ? "Estimated Quote" : "Total"}
                </Text>
                {isOfficeBooking && isEstimate && (
                  <Text
                    style={
                      [
                        theme.typography.body.xs.regular,
                        { color: theme.colors.system.body.disabled },
                      ] as any
                    }
                  >
                    Final price confirmed after inspection
                  </Text>
                )}
              </View>
              {isLoadingQuote ? (
                <ActivityIndicator size="small" color={theme.colors.card.label.active} />
              ) : quoteError ? (
                <Text
                  style={
                    [
                      theme.typography.body.sm.regular,
                      { color: theme.colors.input.label.error },
                    ] as any
                  }
                >
                  {quoteError}
                </Text>
              ) : (
                <View style={styles.priceWrapper}>
                  <Text
                    style={
                      [
                        theme.typography.heading.xs,
                        { color: theme.colors.card.label.active },
                      ] as any
                    }
                  >
                    {total}
                  </Text>
                  <Text
                    style={
                      [
                        theme.typography.body.md.medium,
                        { color: theme.colors.card.label.active },
                      ] as any
                    }
                  >
                    MVR
                  </Text>

                  {frequency !== "Once" && (
                    <Text
                      style={
                        [
                          theme.typography.body.md.regular,
                          {
                            color: theme.colors.card.label.active,
                            fontSize: 14,
                          },
                        ] as any
                      }
                    >
                      /month
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Show recurring charge message when not Once */}
            {frequency !== "Once" && (
              <Text
                style={
                  [
                    theme.typography.body.xs.regular,
                    {
                      color: theme.colors.system.body.disabled,
                      paddingHorizontal: 24,
                      paddingTop: 4,
                    },
                  ] as any
                }
              >
                You will be charged every{" "}
                {frequency === "1x /week" ? "4" : frequency === "2x /week" ? "8" : "12"}{" "}
                bookings. You can cancel your subscription under Manage Subscription in Account.
              </Text>
            )}
          </View>

          {/* Button */}
          <View style={styles.buttonWrapper}>
            <Button
              label={
                isSubmitting || isCreatingCheckout
                  ? isOfficeBooking
                    ? "Submitting..."
                    : "Reserving slot..."
                  : isOfficeBooking
                  ? "Submit Quote"
                  : "Confirm & Pay"
              }
              variant="filled"
              disabled={isLoadingQuote || !!quoteError || isSubmitting || isCreatingCheckout}
              onPress={
                isOfficeBooking
                  ? handleSubmitQuote
                  : handleConfirmAndPay
              }
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContainer: { padding: 24, flexDirection: "column", gap: 8, paddingBottom: 16 },
  header: {
    flexDirection: "row",
    marginBottom: 16,
  },
  image: {
    position: "absolute",
    zIndex: -10,
  },
  info: {},
  promoContainer: {
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
  totalContainerWrapper: {
    marginTop: 8,
    marginBottom: 4,
    flexDirection: "column",
    gap: 8,
  },
  buttonWrapper: { paddingHorizontal: 24, paddingVertical: 16 },
  titleContainer: {
    alignItems: "center",
    width: "78%",
  },
  priceWrapper: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  card: {
    marginHorizontal: 16,
    height: "85%",
    borderRadius: 16,
  },
  totalContainer: {
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  discountRow: {
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
});

export default Review;
