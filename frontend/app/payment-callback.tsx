import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { Icon } from "@/constants/icon";
import GradientText from "@/components/gradientText";
import { bookingApi } from "@/services/bookingService";
import Button from "@/components/button";

type PaymentCallbackStatus = "success" | "failed" | "cancelled" | "error" | "loading";

const PaymentCallback = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    status?: string;
    paymentId?: string;
    transactionId?: string;
    message?: string;
  }>();

  const [callbackStatus, setCallbackStatus] = useState<PaymentCallbackStatus>("loading");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const processCallback = async () => {
      const { status, paymentId, message } = params;

      if (!status) {
        setCallbackStatus("error");
        setErrorMessage("Invalid callback parameters");
        return;
      }

      // Set status based on URL parameter
      if (status === "success") {
        setCallbackStatus("success");
      } else if (status === "cancelled") {
        setCallbackStatus("cancelled");
        setErrorMessage("Payment was cancelled");
      } else if (status === "failed") {
        setCallbackStatus("failed");
        setErrorMessage("Payment failed");
      } else if (status === "error") {
        setCallbackStatus("error");
        setErrorMessage(message || "An error occurred");
      }

      // Fetch payment details if we have a paymentId
      if (paymentId) {
        try {
          const payment = await bookingApi.getPaymentStatus(paymentId);
          setPaymentDetails(payment);
        } catch (error) {
          console.error("Failed to fetch payment status:", error);
        }
      }
    };

    processCallback();
  }, [params]);

  const handleGoHome = () => {
    router.replace("/home");
  };

  const handleRetry = () => {
    router.back();
  };

  const handleViewBooking = () => {
    if (paymentDetails?.booking?.id) {
      router.replace(`/booking-details/${paymentDetails.booking.id}`);
    } else {
      router.replace("/home");
    }
  };

  const renderContent = () => {
    switch (callbackStatus) {
      case "loading":
        return (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.system.body.default} />
            <Text
              style={[
                theme.typography.body.lg.regular,
                { color: theme.colors.system.body.tertiary, marginTop: 16 },
              ]}
            >
              Processing payment...
            </Text>
          </View>
        );

      case "success":
        return (
          <View style={styles.centerContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.system.body.success + "20" },
              ]}
            >
              <Icon.check
                width={48}
                height={48}
                color={theme.colors.system.body.success}
              />
            </View>
            <GradientText
              text="Payment"
              colors={theme.colors.system.heading.default}
              variant={theme.typography.heading.sm}
            />
            <GradientText
              text="Successful!"
              colors={theme.colors.system.heading.default}
              variant={theme.typography.heading.sm}
            />
            <Text
              style={[
                theme.typography.body.md.regular,
                { color: theme.colors.system.body.tertiary, marginTop: 16, textAlign: "center" },
              ]}
            >
              Your payment has been processed successfully. Your booking is now confirmed.
            </Text>
            {paymentDetails?.booking?.bookingNumber && (
              <Text
                style={[
                  theme.typography.body.md.medium,
                  { color: theme.colors.system.body.default, marginTop: 8 },
                ]}
              >
                Booking #{paymentDetails.booking.bookingNumber}
              </Text>
            )}
          </View>
        );

      case "cancelled":
        return (
          <View style={styles.centerContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.system.body.accent + "20" },
              ]}
            >
              <Icon.close
                width={48}
                height={48}
                color={theme.colors.system.body.accent}
              />
            </View>
            <GradientText
              text="Payment"
              colors={theme.colors.system.heading.default}
              variant={theme.typography.heading.sm}
            />
            <GradientText
              text="Cancelled"
              colors={theme.colors.system.heading.default}
              variant={theme.typography.heading.sm}
            />
            <Text
              style={[
                theme.typography.body.md.regular,
                { color: theme.colors.system.body.tertiary, marginTop: 16, textAlign: "center" },
              ]}
            >
              You cancelled the payment. You can try again or choose a different payment method.
            </Text>
          </View>
        );

      case "failed":
      case "error":
        return (
          <View style={styles.centerContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.system.body.error + "20" },
              ]}
            >
              <Icon.close
                width={48}
                height={48}
                color={theme.colors.system.body.error}
              />
            </View>
            <GradientText
              text="Payment"
              colors={theme.colors.system.heading.default}
              variant={theme.typography.heading.sm}
            />
            <GradientText
              text="Failed"
              colors={theme.colors.system.heading.default}
              variant={theme.typography.heading.sm}
            />
            <Text
              style={[
                theme.typography.body.md.regular,
                { color: theme.colors.system.body.tertiary, marginTop: 16, textAlign: "center" },
              ]}
            >
              {errorMessage || "Something went wrong with your payment. Please try again."}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const renderButtons = () => {
    if (callbackStatus === "loading") return null;

    if (callbackStatus === "success") {
      return (
        <View style={styles.buttonContainer}>
          <Button variant="filled" label="View Booking" onPress={handleViewBooking} />
          <Button variant="outline" label="Go Home" onPress={handleGoHome} />
        </View>
      );
    }

    return (
      <View style={styles.buttonContainer}>
        <Button variant="filled" label="Try Again" onPress={handleRetry} />
        <Button variant="outline" label="Go Home" onPress={handleGoHome} />
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.system.background.default },
        ]}
      >
        <View style={styles.content}>
          {renderContent()}
        </View>
        <View style={styles.footer}>
          {renderButtons()}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  centerContent: {
    alignItems: "center",
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  buttonContainer: {
    gap: 12,
  },
});

export default PaymentCallback;
