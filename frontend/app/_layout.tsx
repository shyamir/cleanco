import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { AddressProvider } from "../context/address-context";
import { BookingProvider } from "@/context/booking-context";
import { ActivityProvider } from "@/context/activity-context";
import { HomeDataProvider } from "@/context/home-data-context";
import { ThemeProvider } from "@/theme/ThemeProvider";

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Handle deep links when app is already open
    const handleDeepLink = (event: Linking.EventType) => {
      const { url } = event;
      handleUrl(url);
    };

    // Handle deep link URL
    const handleUrl = (url: string | null) => {
      if (!url) return;

      const parsed = Linking.parse(url);

      // Handle payment callback deep link
      // URL format: cleanco://payment-callback?status=X&paymentId=Y&transactionId=Z
      if (parsed.path === "payment-callback" || parsed.hostname === "payment-callback") {
        const { status, paymentId, transactionId, message } = parsed.queryParams || {};

        router.replace({
          pathname: "/payment-callback",
          params: {
            status: status as string,
            paymentId: paymentId as string,
            transactionId: transactionId as string,
            message: message as string,
          },
        });
      }
    };

    // Check if app was opened from a deep link
    Linking.getInitialURL().then(handleUrl);

    // Subscribe to deep link events
    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [router]);

  return (
    <AddressProvider>
      <BookingProvider>
        <ActivityProvider>
          <HomeDataProvider>
            <ThemeProvider>
              <Stack
                initialRouteName="splash"
                screenOptions={{ headerShown: false, animation: "fade" }}
              />
            </ThemeProvider>
          </HomeDataProvider>
        </ActivityProvider>
      </BookingProvider>
    </AddressProvider>
  );
}
