import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
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
  PaymentMethod,
} from "@/services/bookingService";

const Payment = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();

  const { total, clearPricingCache } = useCleaningBooking();
  const {
    frequency,
    paymentMethod,
    promoCode,
    promoDiscount,
    originalTotal,
    checkoutSession,
    setCheckoutSession,
  } = useBooking();

  const [isPaymentValid, setIsPaymentValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checkout session timer state
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    checkoutSession?.holdDurationSeconds ?? 0
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertShownRef = useRef(false);

  // Format remaining time as M:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Validate checkout session exists on mount
  useEffect(() => {
    if (!checkoutSession && !alertShownRef.current) {
      alertShownRef.current = true;
      Alert.alert(
        "Error",
        "No active checkout session. Please go back and try again.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [checkoutSession, navigation]);

  // Countdown timer
  useEffect(() => {
    if (!checkoutSession || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          // Session expired
          Alert.alert(
            "Session Expired",
            "Your slot reservation has expired. Please go back and try again.",
            [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ]
          );
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [checkoutSession]);

  // Cancel checkout session when navigating away
  const handleGoBack = useCallback(async () => {
    if (checkoutSession) {
      try {
        await bookingApi.cancelCheckout(checkoutSession.checkoutSessionId);
      } catch (error) {
        // Ignore errors when canceling - session will expire anyway
        console.log("Failed to cancel checkout session:", error);
      }
      // Clear session from context
      setCheckoutSession(null);
    }
    navigation.goBack();
  }, [checkoutSession, navigation, setCheckoutSession]);

  const handleConfirm = async () => {
    // Ensure we have a valid checkout session
    if (!checkoutSession) {
      Alert.alert("Error", "No active checkout session. Please go back and try again.");
      return;
    }

    // Check if session is still valid
    if (remainingSeconds <= 0) {
      Alert.alert(
        "Session Expired",
        "Your slot reservation has expired. Please go back and try again.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Handle payment based on method
      if (paymentMethod === PaymentMethod.BML_GATEWAY) {
        // Initiate BML payment for checkout session
        const bmlResponse = await bookingApi.initiateCheckoutBmlPayment(
          checkoutSession.checkoutSessionId
        );

        // Clear cached pricing rules
        clearPricingCache();

        // Open BML payment page in external browser
        const canOpen = await Linking.canOpenURL(bmlResponse.redirectUrl);
        if (canOpen) {
          await Linking.openURL(bmlResponse.redirectUrl);
          // User will be redirected back to app via deep link after payment
        } else {
          Alert.alert("Error", "Unable to open payment page. Please try again.");
        }
      } else {
        // Bank transfer - complete checkout and create booking/subscription
        await bookingApi.processCheckoutBankTransfer(checkoutSession.checkoutSessionId);

        // Clear cached pricing rules
        clearPricingCache();

        // Navigate to confirmation
        router.push("/confirmation");
      }
    } catch (error: any) {
      console.error("Failed to process payment:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to process payment. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If no checkout session, don't render (alert will show and navigate back)
  if (!checkoutSession) {
    return null;
  }

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
                onPress={handleGoBack}
              >
                <Icon.back color={theme.colors.system.body.default} />
              </TouchableOpacity>

              {/* Header with Timer */}
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
              </View>

              {/* Countdown Timer */}
              {checkoutSession && remainingSeconds > 0 && (
                <View
                  style={[
                    styles.timerContainer,
                    {
                      backgroundColor: remainingSeconds <= 60
                        ? theme.colors.pill.background.error
                        : theme.colors.system.background.secondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.body.sm.regular,
                      {
                        color: remainingSeconds <= 60
                          ? theme.colors.system.body.error
                          : theme.colors.system.body.secondary,
                      },
                    ]}
                  >
                    Complete payment in{" "}
                    <Text style={theme.typography.body.sm.medium}>
                      {formatTime(remainingSeconds)}
                    </Text>
                  </Text>
                </View>
              )}

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
          onSecondaryPress={handleGoBack}
          disabledPrimary={!isPaymentValid || isSubmitting || !checkoutSession}
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
    marginBottom: 16,
  },
  timerContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
});

export default Payment;
