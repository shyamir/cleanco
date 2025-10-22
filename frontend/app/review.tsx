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
import GradientText from "./components/gradientText";
import { useNavigation } from "expo-router";
import Button from "./components/button";
import { Icon } from "@/constants/icon";
import InfoRow from "./components/infoRow";

const Review = () => {
  const theme = useTheme();
  const navigation = useNavigation();

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
              icon={<Icon.star color={theme.colors.system.body.disabled} />}
              label="Service"
              value="Home Cleaning"
            />

            <InfoRow
              icon={<Icon.location color={theme.colors.system.body.disabled} />}
              label="Address"
              value="Hiyaa Towers H11, Nirolhu Magu, Male, Maldives"
            />

            <InfoRow
              icon={<Icon.calendar color={theme.colors.system.body.disabled} />}
              label="Schedule"
              value="1 Sep 2025, 08:00"
            />

            <InfoRow
              icon={<Icon.notes color={theme.colors.system.body.disabled} />}
              label="Details"
              value="2 bedrooms, 1 bathroom, No Pets"
            />

            <InfoRow
              icon={<Icon.notes color={theme.colors.system.body.disabled} />}
              label="Special Instructions"
              value="-"
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
                435
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
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  label: {
    color: "#777",
    marginBottom: 4,
  },
  value: {
    color: "#222",
  },
  promoButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  promoText: {
    color: "#2E68F2",
    fontWeight: "500",
  },
  totalContainer: {
    paddingHorizontal: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2E68F2",
  },
  payButton: {
    borderRadius: 30,
    overflow: "hidden",
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
