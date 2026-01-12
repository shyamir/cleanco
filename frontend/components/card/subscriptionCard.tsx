import React from "react";
import { View, Text, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import InfoRow from "@/components/infoRow";
import Button from "@/components/button";
import { Icon } from "@/constants/icon";
import { useTheme } from "@/theme/ThemeProvider";
import Base from "./base";

type SubscriptionCardProps = {
  subscriptionId: string;
  type: "home" | "office";
  title: string;
  address: string;
  frequency: string;
  days: string;
  time: string;
  price: string;
  startDate: string;
  startLabel?: string;
  renewalOrEndDate: string;
  renewalOrEndLabel: string;
  status: string;
  onCancel?: () => void;
};

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscriptionId,
  type,
  title,
  address,
  frequency,
  days,
  time,
  price,
  startDate,
  startLabel = "Started",
  renewalOrEndDate,
  renewalOrEndLabel,
  status,
  onCancel,
}) => {
  const { theme } = useTheme();

  const gradientColors =
    type === "home"
      ? theme.colors.card.background.secondary // orange gradient
      : theme.colors.card.background.primary; // blue gradient

  const isCanceled = status === "CANCELED";

  return (
    <View style={{ width: "100%" }}>
      {/* Top gradient strip */}
      <LinearGradient
        colors={gradientColors}
        style={styles.gradientStrip}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />

      {/* Card */}
      <Base style={styles.cardContainer}>
        <View>
          {/* Subscription ID & Status Badge */}
          <View style={styles.idRow}>
            <InfoRow
              icon={<Icon.id color={theme.colors.system.body.disabled} />}
              label={subscriptionId.slice(0, 8).toUpperCase()}
              labelStyle={{ color: theme.colors.system.body.default }}
              containerStyle={{ marginBottom: 0, flex: 1 }}
            />
            {isCanceled && (
              <View style={[styles.statusBadge, { backgroundColor: theme.colors.button.background.error }]}>
                <Text style={[theme.typography.body.sm, { color: "#fff" }]}>Canceled</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <InfoRow
            icon={<Icon.sparkle color={theme.colors.system.body.disabled} />}
            label={title}
            labelStyle={{ color: theme.colors.system.body.default }}
          />

          {/* Address */}
          <InfoRow
            icon={<Icon.location color={theme.colors.system.body.disabled} />}
            label={address}
            labelStyle={{ color: theme.colors.system.body.default }}
          />

          {/* Frequency */}
          <InfoRow
            icon={<Icon.calendar color={theme.colors.system.body.disabled} />}
            label={frequency}
            labelStyle={{ color: theme.colors.system.body.default }}
          />

          {/* Schedule (day-time pairs) */}
          <InfoRow
            icon={<Icon.clock color={theme.colors.system.body.disabled} />}
            label={time}
            labelStyle={{ color: theme.colors.system.body.default }}
          />

          {/* Price */}
          <InfoRow
            icon={<Icon.bill color={theme.colors.system.body.disabled} />}
            label={price}
            labelStyle={{ color: theme.colors.system.body.default }}
          />

          {/* Dates Row */}
          <View style={styles.datesRow}>
            <View style={styles.dateItem}>
              <Text style={[theme.typography.body.sm, { color: theme.colors.system.body.disabled }]}>
                {startLabel}
              </Text>
              <Text style={[theme.typography.body.md, { color: theme.colors.system.body.default }]}>
                {startDate}
              </Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={[theme.typography.body.sm, { color: theme.colors.system.body.disabled }]}>
                {renewalOrEndLabel}
              </Text>
              <Text style={[theme.typography.body.md, { color: theme.colors.system.body.default }]}>
                {renewalOrEndDate}
              </Text>
            </View>
          </View>

          {/* Cancel Button - only show if not canceled */}
          {!isCanceled && (
            <View style={{ marginTop: 8, alignItems: "flex-end" }}>
              <Button
                variant="text"
                label="Cancel"
                onPress={onCancel}
                icon={<Icon.close color={theme.colors.button.label.error} />}
                textStyle={{ color: theme.colors.button.label.error }}
              />
            </View>
          )}
        </View>
      </Base>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientStrip: {
    height: 24,
    width: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContainer: {
    paddingBottom: 8,
    marginTop: -18,
  },
  idRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  datesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 4,
  },
  dateItem: {
    flex: 1,
  },
});

export default SubscriptionCard;
