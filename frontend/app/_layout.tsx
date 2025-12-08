import { Stack } from "expo-router";
import { AddressProvider } from "../context/address-context";
import { BookingProvider } from "@/context/booking-context";
import { ActivityProvider } from "@/context/activity-context";
import { HomeDataProvider } from "@/context/home-data-context";
import { ThemeProvider } from "@/theme/ThemeProvider";

export default function RootLayout() {
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
