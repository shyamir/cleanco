import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import BaseCard from "./base";
import InfoRow from "../infoRow";
import { Icon } from "@/constants/icon";
import { Booking } from "@/constants/mockBookings";
import { toTitleCase, isTodayOrTomorrow, parseBookingDate } from "@/utils/date";

type ActivityCardProps = {
  booking: Booking;
};

const ActivityCard: React.FC<ActivityCardProps> = ({ booking }) => {
  const {theme} = useTheme();

  const dayLabel = isTodayOrTomorrow(booking.date, booking.time);
  if (!dayLabel) return null;

  const bookingImage =
    booking.type === "home cleaning"
      ? require("@/assets/images/home-cleaning.png")
      : require("@/assets/images/office-cleaning.png");

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
              {toTitleCase(booking.type)}
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
              {dayLabel}
            </Text>
          </View>
          <Image
            style={styles.image}
            source={bookingImage}
            resizeMode="contain"
            // style={{ width: 100, height: 100 }} // adjust as needed
          />
        </View>

        <InfoRow
          icon={<Icon.calendar color={theme.colors.card.label.secondary} />}
          label={`${booking.date}, ${booking.time}`}
          labelColor={theme.colors.card.label.secondary}
        />
        <InfoRow
          icon={<Icon.location color={theme.colors.card.label.secondary} />}
          label={booking.address}
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
