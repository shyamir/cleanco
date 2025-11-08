import { Stack } from "expo-router";
import { AddressProvider } from "../context/address-context";
import { BookingProvider } from "@/context/booking-context";

export default function RootLayout() {
  return (
    <AddressProvider>
      <BookingProvider>
        <Stack
          initialRouteName="splash"
          screenOptions={{ headerShown: false }}
        />
      </BookingProvider>
    </AddressProvider>
  );
}
