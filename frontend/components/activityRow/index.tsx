import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Icon } from "@/constants/icon";
import { useRouter } from "expo-router";
import { ActivityBooking, ServiceType } from "@/services/bookingService";

type ActivityRowProps = {
  booking: ActivityBooking;
};

const ActivityRow: React.FC<ActivityRowProps> = ({ booking }) => {
  const { theme } = useTheme();
  const router = useRouter();

  const isHomeService = booking.serviceType === ServiceType.HOME;
  const barColor = isHomeService
    ? theme.colors.system.border.active
    : theme.colors.system.border.secondary;

  const title = isHomeService ? "Home Cleaning" : "Office Cleaning";

  // Build address display: prefer snapshot data for historical accuracy
  const label = booking.addressLabel ?? booking.address?.label;
  const address = booking.addressAddress ?? booking.address?.address;
  const displayAddress = label ? `${label} - ${address}` : address;

  const handlePress = () => {
    router.push(`/booking-details?id=${booking.id}`);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={styles.touchWrapper}
    >
      <View style={styles.container}>
        <View style={[styles.colorBar, { backgroundColor: barColor }]} />

        <View style={styles.textContainer}>
          <Text
            style={[
              theme.typography.body.md.medium,
              { color: theme.colors.system.body.default },
            ]}
          >
            {title}
          </Text>

          <View style={styles.row}>
            <View style={styles.locationRow}>
              <Icon.location
                color={theme.colors.system.body.disabled}
                width={12}
                height={12}
              />
              <Text
                style={[
                  theme.typography.body.sm.regular,
                  { color: theme.colors.system.body.disabled },
                ]}
                numberOfLines={1}
              >
                {displayAddress}
              </Text>
            </View>
            <Text
              style={[
                theme.typography.body.sm.regular,
                { color: theme.colors.system.body.disabled },
              ]}
            >
              {booking.timeSlot.displayStartTime}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchWrapper: { width: "100%" },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  colorBar: {
    width: 3,
    height: "100%",
    borderRadius: 4,
  },
  textContainer: {
    flex: 1,
    flexDirection: "column",
    gap: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "70%",
  },
});

export default ActivityRow;
