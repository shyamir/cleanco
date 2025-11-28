import React from "react";
import { View, Text, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import InfoRow from "@/components/infoRow";
import Button from "@/components/button";
import { Icon } from "@/constants/icon";
import { useTheme } from "@/theme/ThemeProvider";
import Base from "./base";

type SubscriptionCardProps = {
  type: "home" | "office";
  title: string;
  address: string;
  frequency: string;
  onCancel?: () => void;
};

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  type,
  title,
  address,
  frequency,
  onCancel,
}) => {
  const { theme } = useTheme();

  const gradientColors =
    type === "home"
      ? theme.colors.card.background.secondary // orange gradient
      : theme.colors.card.background.primary; // blue gradient

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

          {/* Cancel Button */}
          <View style={{ marginTop: 8, alignItems: "flex-end" }}>
            <Button
              variant="text"
              label="Cancel"
              onPress={onCancel}
              icon={<Icon.close color={theme.colors.button.label.error} />}
              textStyle={{ color: theme.colors.button.label.error }}
            />
          </View>
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
    // borderTopRightRadius: 0,
    // borderTopLeftRadius: 0,
    paddingBottom: 8,
    marginTop: -18,
  },
});

export default SubscriptionCard;
