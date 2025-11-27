import { Stack } from "expo-router";
import { AddressProvider } from "../context/address-context";
import { BookingProvider } from "@/context/booking-context";
import { ThemeProvider } from "@/theme/ThemeProvider";

export default function RootLayout() {
  return (
    <AddressProvider>
      <BookingProvider>
        <ThemeProvider>
          <Stack
            initialRouteName="splash"
            screenOptions={{ headerShown: false, animation: "fade" }}
          />
        </ThemeProvider>
      </BookingProvider>
    </AddressProvider>
  );
}
