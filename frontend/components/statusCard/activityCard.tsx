import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BaseCard from "./base";
import InfoRow from "../infoRow";
import { Icon } from "@/constants/icon";
import { ActivityBooking, ServiceType } from "@/services/bookingService";

dayjs.extend(utc);
dayjs.extend(timezone);

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

  // Get relative day label (Today, Tomorrow, or day name)
  const getRelativeDayLabel = () => {
    // Compare date strings in Maldives timezone
    const bookingDateStr = dayjs.utc(booking.date).format("YYYY-MM-DD");
    const maldivesNow = dayjs().tz("Indian/Maldives");
    const todayStr = maldivesNow.format("YYYY-MM-DD");
    const tomorrowStr = maldivesNow.add(1, "day").format("YYYY-MM-DD");

    if (bookingDateStr === todayStr) {
      return "Today";
    } else if (bookingDateStr === tomorrowStr) {
      return "Tomorrow";
    } else {
      return dayjs.utc(booking.date).format("dddd");
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

        <View style={styles.imageWrapper}>
          <Image
            source={require("@/assets/images/activity-1.png")}
            resizeMode="contain"
          />
        </View>
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  wrapper: { height: "auto" },
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
    zIndex: -10,
    position: "absolute",
    top: 0,
    right: -120,
    opacity: 0.9,
  },
  image: { width: 100, height: 100 },
});

export default ActivityCard;
