import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import BaseCard from "./base";
import InfoRow from "../infoRow";
import { Icon } from "@/constants/icon";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

type UpcomingServiceCardProps = {
  serviceType: "home" | "office";
  date: string; // ISO date string
  time: string; // Display time like "08:00 AM"
  address: string;
};

const UpcomingServiceCard: React.FC<UpcomingServiceCardProps> = ({
  serviceType,
  date,
  time,
  address,
}) => {
  const { theme } = useTheme();

  const getServiceImage = () => {
    switch (serviceType) {
      case "home":
        return require("@/assets/images/home-cleaning.png");
      case "office":
        return require("@/assets/images/office-cleaning.png");
      default:
        return require("@/assets/images/home-cleaning.png");
    }
  };

  const getServiceLabel = () => {
    return serviceType === "home" ? "Home Cleaning" : "Office Cleaning";
  };

  const getRelativeDateLabel = () => {
    const bookingDate = dayjs.utc(date);
    const today = dayjs().startOf("day");
    const tomorrow = today.add(1, "day");

    if (bookingDate.isSame(today, "day")) {
      return "Today";
    } else if (bookingDate.isSame(tomorrow, "day")) {
      return "Tomorrow";
    } else {
      return bookingDate.format("dddd"); // Day name like "Wednesday"
    }
  };

  const getFormattedDateTime = () => {
    const bookingDate = dayjs.utc(date);
    return `${bookingDate.format("D MMM YYYY")}, ${time}`;
  };

  return (
    <BaseCard colors={theme.colors.card.background.primary}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text
            style={[
              {
                ...theme.typography.heading.xs2,
                color: theme.colors.system.heading.active,
              } as any,
            ]}
          >
            Upcoming cleaning
          </Text>
        </View>
        <View style={styles.body}>
          <View style={styles.textWrapper}>
            <Text
              style={[
                {
                  ...theme.typography.body.xs,
                  color: theme.colors.system.heading.active,
                } as any,
              ]}
            >
              {getServiceLabel()}
            </Text>
            <Text
              style={[
                {
                  ...theme.typography.heading.xs3.medium,
                  color: theme.colors.system.heading.secondary[1],
                } as any,
              ]}
            >
              {getRelativeDateLabel()}
            </Text>
          </View>
          <Image
            source={getServiceImage()}
            resizeMode="contain"
            style={{ width: 100, height: 100 }}
          />
        </View>
        <View style={styles.footer}>
          <InfoRow
            icon={<Icon.calendar color={theme.colors.system.body.disabled} />}
            label={getFormattedDateTime()}
            labelColor={theme.colors.card.label.default}
          />
          <InfoRow
            icon={<Icon.location color={theme.colors.system.body.disabled} />}
            label={address}
            labelColor={theme.colors.card.label.default}
          />
        </View>
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    alignContent: "flex-start",
    justifyContent: "space-between",
    padding: 16,
    flexDirection: "column",
    // gap: 16,
  },
  header: {},
  footer: {
    alignItems: "center",
    gap: 0,
  },
  body: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    // backgroundColor: "#ff0000"
  },
  textWrapper: {
    flexDirection: "column",
    gap: 2,
  },
});

export default UpcomingServiceCard;
