import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";
import HistoryRow from "@/components/historyRow";
import { Icon } from "@/constants/icon";
import { useActivity } from "@/context/activity-context";

export default function Quotes() {
  const { theme } = useTheme();
  const router = useRouter();
  const { quotes, isLoading, isRefreshing, refreshBookings } = useActivity();

  const hasQuotes = quotes.length > 0;

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView
          style={[
            styles.container,
            { backgroundColor: theme.colors.system.background.default },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push("/activity")}>
              <Icon.back color={theme.colors.system.body.default} />
            </TouchableOpacity>
            <Text
              style={[
                {
                  ...theme.typography.heading.xs,
                  color: theme.colors.system.body.tertiary,
                },
              ]}
            >
              Quotes
            </Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme.colors.system.body.default}
            />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.system.background.default },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/activity")}>
            <Icon.back color={theme.colors.system.body.default} />
          </TouchableOpacity>

          <Text
            style={[
              {
                ...theme.typography.heading.xs,
                color: theme.colors.system.body.tertiary,
              },
            ]}
          >
            Quotes
          </Text>
        </View>

        {/* Info banner */}
        <View
          style={[
            styles.infoBanner,
            { backgroundColor: theme.colors.pill.background.warning },
          ]}
        >
          <Icon.bill color={theme.colors.pill.label.warning} />
          <Text
            style={[
              theme.typography.body.sm.regular,
              { color: theme.colors.pill.label.warning, flex: 1 },
            ]}
          >
            These office cleaning requests are awaiting inspection and price
            confirmation. We will contact you to schedule an inspection.
          </Text>
        </View>

        {/* Empty State */}
        {!hasQuotes ? (
          <ScrollView
            contentContainerStyle={styles.emptyState}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshBookings}
                tintColor={theme.colors.system.body.default}
              />
            }
          >
            <Image
              source={require("@/assets/images/empty-bookings.png")}
              style={styles.emptyImage}
            />
            <Text
              style={{
                ...theme.typography.body.md.regular,
                color: theme.colors.system.body.disabled,
              }}
            >
              You have no pending quotes
            </Text>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshBookings}
                tintColor={theme.colors.system.body.default}
              />
            }
          >
            {quotes.map((booking) => (
              <HistoryRow key={booking.id} booking={booking} hideRebook />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  header: {
    flexDirection: "column",
    gap: 12,
    paddingVertical: 16,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  list: { flexDirection: "column", gap: 16, paddingBottom: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  emptyImage: {
    height: 200,
    opacity: 0.5,
    resizeMode: "contain",
  },
});
