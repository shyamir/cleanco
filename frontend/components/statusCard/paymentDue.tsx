import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/useTheme";
import BaseCard from "./baseCard";
import InfoRow from "../infoRow";
import { Icon } from "@/constants/icon";
import GradientText from "../gradientText";

const PaymentDue = () => {
  const theme = useTheme();

  return (
    <BaseCard colors={theme.colors.card.background.primary}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text
            style={[
              {
                ...theme.typography.heading.xs3,
                color: theme.colors.system.heading.active,
              } as any,
            ]}
          >
            Your payment is due in{" "}
          </Text>

          {/* change to gradien text */}
          <Text
            style={[
              {
                ...theme.typography.heading.xs3,
                color: theme.colors.system.heading.active,
              } as any,
            ]}
          >
            2 days
          </Text>
        </View>

        <View style={styles.body}>
          <InfoRow
            icon={<Icon.star color={theme.colors.system.body.disabled} />}
            label="Home Cleaning"
            labelColor={theme.colors.card.label.default}
          />

          <InfoRow
            icon={<Icon.location color={theme.colors.system.body.disabled} />}
            label="Hiyaa Towers H11, Nirolhu Magu, Male, Maldives"
            labelColor={theme.colors.card.label.default}
          />
          <InfoRow
            icon={<Icon.calendar color={theme.colors.system.body.disabled} />}
            label="1x /week"
            labelColor={theme.colors.card.label.default}
          />
        </View>
        <View style={styles.footer}>
          <Text
            style={[
              {
                ...theme.typography.heading.sm,
                color: theme.colors.system.heading.active,
              } as any,
            ]}
          >
            435
          </Text>
          <Text
            style={[
              {
                ...theme.typography.heading.xs2,
                color: theme.colors.system.heading.active,
              } as any,
            ]}
          >
            MVR
          </Text>
        </View>
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
  },
  footer: {
    justifyContent:"flex-end",
    flexDirection: "row",
    gap: 4,
    alignItems: "baseline", // keeps texts aligned
  },
  body: {
    alignItems: "center",
    gap: 0,
  },
});

export default PaymentDue;
