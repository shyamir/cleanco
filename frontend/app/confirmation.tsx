import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import GradientText from "@/components/gradientText";
import LinearGradient from "react-native-linear-gradient";
import Button from "@/components/button";
import { useRouter } from "expo-router";
import { Icon } from "@/constants/icon";
import { useAddress } from "@/context/address-context";
import { useBooking } from "@/context/booking-context";
import { useActivity } from "@/context/activity-context";
import { useHomeData } from "@/context/home-data-context";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const Confirmation = ({}) => {
  const { theme } = useTheme();
  const router = useRouter();

  const { selected, clearSelected } = useAddress();
  const { service, schedule, frequency, startDate, resetBooking, isEstimate } = useBooking();
  const { refreshBookings } = useActivity();
  const { refreshHomeData } = useHomeData();

  // Determine if this was an office booking
  const isOfficeBooking = service === "Office Cleaning";

  // Refresh activity bookings and home data when confirmation page mounts (booking just created)
  useEffect(() => {
    refreshBookings();
    refreshHomeData();
  }, []);

  const handleNavigateHome = () => {
    resetBooking();
    clearSelected();
    router.push("/home");
  };

  const handleViewBooking = () => {
    resetBooking();
    clearSelected();
    router.push("/activity");
  };

  let scheduleDisplay = "-";

  if (frequency === "Once") {
    if (schedule) {
      const [datePart, timePart] = schedule.split(",");
      const formattedDate = dayjs.utc(datePart).format("D MMM YYYY");
      scheduleDisplay = timePart
        ? `${formattedDate},${timePart}`
        : formattedDate;
    }
  } else {
    const start = startDate
      ? `Starts: ${dayjs.utc(startDate).format("D MMM YYYY")} (${frequency})`
      : "";
    const repeat = schedule ? `\n${schedule}` : "";
    scheduleDisplay = `${start}${repeat}`.trim() || "-";
  }

  return (
    <SafeAreaProvider
      style={[
        styles.container,
        { backgroundColor: theme.colors.system.background.default },
      ]}
    >
      <SafeAreaView style={[styles.wrapper]}>
        {/* Header */}
        <View style={styles.header}>
          <GradientText
            text={isOfficeBooking ? "Quote" : "Booking"}
            colors={theme.colors.system.heading.secondary}
            variant={theme.typography.heading.sm}
          />
          <Text
            style={[
              {
                ...theme.typography.heading.sm,
                color: theme.colors.system.body.tertiary,
              } as any,
            ]}
          >
            {isOfficeBooking ? "Submitted!" : "Confirmed!"}
          </Text>
        </View>

        {/* Body */}
        <LinearGradient
          colors={theme.colors.system.background.tertiary}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientBackground}
        >
          <View style={styles.body}>
            <View style={styles.header}>
              <Text
                style={[
                  {
                    ...theme.typography.heading.xs2,
                    color: theme.colors.card.label.default,
                  } as any,
                ]}
              >
                {isOfficeBooking
                  ? "Thank you for your quote request!"
                  : "Thank you for your booking!"}
              </Text>
              <Text
                style={[
                  {
                    ...theme.typography.body.md.regular,
                    color: theme.colors.card.label.default,
                  } as any,
                ]}
              >
                {isOfficeBooking
                  ? "We will contact you to schedule an inspection. The final price will be confirmed after the inspection."
                  : "Booking confirmation has been sent to your registered phone number"}
              </Text>
            </View>
            <View style={styles.content}>
              <View style={styles.row}>
                <Icon.sparkle color={theme.colors.system.body.accent} />
                <Text
                  style={[
                    {
                      ...theme.typography.body.md.medium,
                      color: theme.colors.card.label.default,
                    } as any,
                  ]}
                >
                  {service || "-"}
                </Text>
              </View>
              <View style={styles.row}>
                <Icon.pin color={theme.colors.system.body.accent} />
                <Text
                  style={[
                    {
                      ...theme.typography.body.md.medium,
                      color: theme.colors.card.label.default,
                    } as any,
                  ]}
                >
                  {selected?.label + ", " + selected?.address || "-"}
                </Text>
              </View>
              <View style={styles.row}>
                <Icon.calendar color={theme.colors.system.body.accent} />
                <Text
                  style={[
                    {
                      ...theme.typography.body.md.medium,
                      color: theme.colors.card.label.default,
                    } as any,
                  ]}
                >
                  {scheduleDisplay}
                </Text>
              </View>
            </View>
          </View>
          <Image
            source={require("@/assets/images/confirmation.png")}
            style={styles.image}
            resizeMode="cover"
          />
        </LinearGradient>

        {/* Footer / Buttons */}
        <View style={styles.buttonRow}>
          <Button
            label={isOfficeBooking ? "View Quote" : "View Booking"}
            variant="outline"
            onPress={handleViewBooking}
          />
          <Button
            label="Back to Home"
            variant="filled"
            onPress={handleNavigateHome}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  wrapper: {
    flex: 1,
    flexDirection: "column",
    gap: 16,
  },
  header: {
    flexDirection: "column",
    gap: 8,
  },
  gradientBackground: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
  },
  body: {
    flex: 1,
    flexDirection: "column",
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 32,
  },
  buttonRow: {
    flexDirection: "column",
    gap: 8,
  },
  content: {
    flexDirection: "column",
    paddingHorizontal: 32,
    gap: 24,
  },
  image: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
});

export default Confirmation;
