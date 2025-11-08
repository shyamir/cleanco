import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/useTheme";
import GradientText from "../components/gradientText";
import { useNavigation } from "expo-router";
import Button from "../components/button";
import { Icon } from "@/constants/icon";
import InfoRow from "../components/infoRow";
import { useAddress } from "../context/address-context";
import { useBooking } from "@/context/booking-context";
import useCleaningBooking from "./hooks/useCleaningBooking";
import dayjs from "dayjs";

const Review = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { selected } = useAddress();
  const {
    pet,
    otherPet,
    frequency,
    schedule,
    setSchedule,
    instructions,
    startDate,
  } = useBooking();
  const { bedrooms, bathrooms, total, slots } = useCleaningBooking();

  const petDisplay =
    pet && pet !== "None" ? (pet === "Other" ? otherPet : pet) : "No Pets";

  const bedroomCount = Number(bedrooms);
  const bathroomCount = Number(bathrooms);

  let scheduleDisplay = "-";

  if (frequency === "Once") {
    if (schedule) {
      // schedule contains "YYYY-MM-DD, HH:mm" or similar
      const [datePart, timePart] = schedule.split(",");
      const formattedDate = dayjs(datePart).format("D MMM YYYY");
      scheduleDisplay = timePart
        ? `${formattedDate},${timePart}`
        : formattedDate;
    } else {
      scheduleDisplay = "-";
    }
  } else {
    const start = startDate
      ? `Starts: ${dayjs(startDate).format("D MMM YYYY") + " (" + frequency +")"}`
      : "";
    const repeat = schedule ? `\n${schedule}` : "";
    scheduleDisplay = `${start}${repeat}`.trim() || "-";
  }
  return (
    <LinearGradient
      colors={theme.colors.system.background.tertiary}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back-outline"
              size={24}
              color={theme.colors.system.heading.active}
            />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <GradientText
              text="Review"
              colors={theme.colors.system.heading.secondary}
              variant={theme.typography.heading.md}
            />
            <Text
              style={[
                {
                  ...theme.typography.heading.md,
                  color: theme.colors.system.heading.active,
                } as any,
              ]}
            >
              Booking
            </Text>
            <Image
              source={require("@/assets/images/review.png")}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.system.background.default },
          ]}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <InfoRow
              icon={<Icon.sparkle color={theme.colors.system.body.disabled} />}
              label="Service"
              value="Home Cleaning"
            />
            <InfoRow
              icon={<Icon.location color={theme.colors.system.body.disabled} />}
              label="Address"
              value={selected?.label + ", " + selected?.address || "-"}
            />

            <InfoRow
              icon={<Icon.calendar color={theme.colors.system.body.disabled} />}
              label={frequency === "Once" ? "Date" : "Schedule"}
              value={scheduleDisplay}
            />
            <InfoRow
              icon={<Icon.notes color={theme.colors.system.body.disabled} />}
              label="Details"
              value={`${bedroomCount} bedroom${
                bedroomCount > 1 ? "s" : ""
              }, ${bathroomCount} bathroom${
                bathroomCount > 1 ? "s" : ""
              }, ${petDisplay}`}
            />
            <InfoRow
              icon={<Icon.notes color={theme.colors.system.body.disabled} />}
              label="Special Instructions"
              value={instructions || "-"}
            />
          </ScrollView>

          {/* Total */}
          <View style={styles.totalContainer}>
            <Text
              style={
                [
                  theme.typography.heading.xs2,
                  { color: theme.colors.system.body.default },
                ] as any
              }
            >
              Total
            </Text>
            <View style={styles.priceWrapper}>
              <Text
                style={
                  [
                    theme.typography.heading.xs,
                    { color: theme.colors.card.label.active },
                  ] as any
                }
              >
                {total}
              </Text>
              <Text
                style={
                  [
                    theme.typography.body.md.medium,
                    { color: theme.colors.card.label.active },
                  ] as any
                }
              >
                MVR
              </Text>
            </View>
          </View>

          {/* Button */}
          <View style={styles.buttonWrapper}>
            <Button label="Confirm & Pay" variant="filled" onPress={() => {}} />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContainer: { padding: 24, flex: 1, flexDirection: "column", gap: 8 },
  header: {
    flexDirection: "row",
    marginBottom: 16,
  },
  image: {
    position: "absolute",
    zIndex: -10,
  },
  buttonWrapper: { paddingHorizontal: 24, paddingVertical: 16 },
  titleContainer: {
    alignItems: "center",
    width: "78%",
  },
  priceWrapper: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  card: {
    marginHorizontal: 16,
    height: "85%",
    borderRadius: 16,
  },
  totalContainer: {
    paddingHorizontal: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
});

export default Review;
