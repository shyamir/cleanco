import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import BaseCard from "./base";
import InfoRow from "../infoRow";
import { Icon } from "@/constants/icon";
import { ActivityBooking, ServiceType } from "@/services/bookingService";

dayjs.extend(utc);

// Get current date in Maldives timezone (UTC+5, no daylight saving)
const getMaldivesNow = () => {
  const MALDIVES_OFFSET_HOURS = 5;
  return dayjs.utc().add(MALDIVES_OFFSET_HOURS, 'hour');
};

type ActivityCardProps = {
  booking: ActivityBooking;
};

const ActivityCard: React.FC<ActivityCardProps> = ({ booking }) => {
  const { theme } = useTheme();

  const isHomeService = booking.serviceType === ServiceType.HOME;
  const serviceLabel = isHomeService ? "Home Cleaning" : "Office Cleaning";

  const bookingImage = isHomeService
    ? require("@/assets/images/home-cleaning.png")
    : require("@/assets/images/office-cleaning.png");

  // Get relative day label (Today, Tomorrow, day name for this week, or date)
  const getRelativeDayLabel = () => {
    const bookingDate = dayjs.utc(booking.date);
    const bookingDateStr = bookingDate.format("YYYY-MM-DD");
    const maldivesNow = getMaldivesNow();
    const todayStr = maldivesNow.format("YYYY-MM-DD");
    const tomorrowStr = maldivesNow.add(1, "day").format("YYYY-MM-DD");

    if (bookingDateStr === todayStr) {
      return "Today";
    } else if (bookingDateStr === tomorrowStr) {
      return "Tomorrow";
    } else {
      // Show day name only for dates within next 6 days
      const daysUntil = bookingDate.diff(maldivesNow, "day");
      if (daysUntil <= 6) {
        return bookingDate.format("dddd"); // "Wednesday"
      } else {
        return bookingDate.format("ddd, D MMM"); // "Wed, 21 Jan"
      }
    }
  };

  // Build address display
  const { label, address } = booking.address;
  const displayAddress = label ? `${label} - ${address}` : address;

  // Format date and time
  const formattedDate = dayjs.utc(booking.date).format("D MMM YYYY");
  const formattedTime = booking.timeSlot.displayStartTime;

  return (
    <BaseCard
      colors={theme.colors.card.background.primary}
      customStyle={styles.wrapper}
    >
      <View style={styles.container}>
        {/* Decorative image rendered first so it appears behind other content */}
        <View style={styles.imageWrapper}>
          <Image
            source={require("@/assets/images/activity-1.png")}
            resizeMode="contain"
          />
        </View>

        <View style={styles.body}>
          <View style={styles.textWrapper}>
            <Text
              style={[
                {
                  ...theme.typography.body.sm.regular,
                  color: theme.colors.card.label.default,
                } as any,
              ]}
            >
              {serviceLabel}
            </Text>

            <Text
              style={[
                {
                  ...theme.typography.heading.xs2,
                  color: theme.colors.card.label.default,
                } as any,
                styles.text,
              ]}
            >
              {getRelativeDayLabel()}
            </Text>
          </View>
          <Image
            style={styles.image}
            source={bookingImage}
            resizeMode="contain"
          />
        </View>

        <InfoRow
          icon={<Icon.calendar color={theme.colors.card.label.secondary} />}
          label={`${formattedDate}, ${formattedTime}`}
          labelColor={theme.colors.card.label.secondary}
        />
        <InfoRow
          icon={<Icon.location color={theme.colors.card.label.secondary} />}
          label={displayAddress}
          labelColor={theme.colors.card.label.secondary}
        />
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  wrapper: { height: "auto", overflow: "hidden" },
  container: {
    alignItems: "flex-start",
    flexDirection: "column",
    paddingHorizontal: 24,
  },
  body: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
  },
  textWrapper: { gap: 8, paddingVertical: 12 },
  text: {},
  imageWrapper: {
    position: "absolute",
    top: 0,
    right: -120,
    opacity: 0.9,
  },
  image: { width: 100, height: 100 },
});

export default ActivityCard;
