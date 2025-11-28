import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";
import { Icon } from "@/constants/icon";
import SubscriptionCard from "@/components/card/subscriptionCard";
import { MOCK_BOOKINGS } from "@/constants/mockBookings";

export default function Subscription() {
  const { theme } = useTheme();
  const router = useRouter();

  const subscriptions = Object.values(MOCK_BOOKINGS).filter(
    (booking) => booking.status === "upcoming" || booking.status === "pending"
  );
    
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
              Subscription
            </Text>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {subscriptions.map((booking) => (
              <SubscriptionCard
                key={booking.id}
                type={booking.type.includes("home") ? "home" : "office"}
                title={booking.title}
                address={booking.address}
                frequency={booking.schedule} // or pass a formatted repeat interval
                onCancel={() => {
                  console.log(`Cancel subscription for booking #${booking.id}`);
                }}
              />
            ))}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  scrollContainer: { flexGrow: 1, gap: 12 },
  backBtn: { width: 32, height: 32, justifyContent: "center", marginBottom: 8 },
  header: { flexDirection: "column", gap: 8 },
});
