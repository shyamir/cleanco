import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Button from "@/components/button";
import { useTheme } from "@/theme/ThemeProvider";

type FooterSummaryProps = {
  total?: number;
  currency?: string;
  frequency?: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimaryPress: () => void;
  onSecondaryPress: () => void;
  disabledPrimary?: boolean;
  // Optional promo discount display
  originalTotal?: number;
  promoDiscount?: number;
  promoCode?: string | null;
};

const FooterSummary: React.FC<FooterSummaryProps> = ({
  total,
  currency = "MVR",
  frequency,
  primaryLabel,
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress,
  disabledPrimary = false,
  originalTotal,
  promoDiscount,
  promoCode,
}) => {
  const {theme} = useTheme();
  const isOnce = frequency === "Once";
  const hasDiscount = promoCode && promoDiscount && promoDiscount > 0 && originalTotal && originalTotal > 0;

  return (
    <View
      style={[
        styles.footer,
        { backgroundColor: theme.colors.system.background.secondary },
      ]}
    >
      {/* Show discount info if promo applied */}
      {hasDiscount && (
        <View style={styles.discountInfo}>
          <Text
            style={[
              theme.typography.body.sm.regular as any,
              { color: theme.colors.system.body.disabled },
            ]}
          >
            Subtotal: {originalTotal} {currency}
          </Text>
          <Text
            style={[
              theme.typography.body.sm.regular as any,
              { color: theme.colors.input.label.success },
            ]}
          >
            Discount ({promoCode}): -{promoDiscount} {currency}
          </Text>
        </View>
      )}
      <View style={styles.textWrapper}>
        <Text
          style={[
            {
              ...theme.typography.heading.xs3.book,
              color: theme.colors.system.heading.tertiary,
            } as any,
          ]}
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
                theme.typography.heading.xs4.medium,
                { color: theme.colors.card.label.active },
              ] as any
            }
          >
            {currency}
          </Text>

          {/* Conditionally show /month */}
          {!isOnce && (
            <Text
              style={
                [
                  theme.typography.body.sm.regular,
                  { color: theme.colors.card.label.active },
                ] as any
              }
            >
              / month
            </Text>
          )}
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <View style={styles.buttonContainer}>
          <Button
            label={secondaryLabel}
            variant="outline"
            onPress={onSecondaryPress}
          />
        </View>

        <View
          style={[styles.buttonContainer, disabledPrimary && { opacity: 0.5 }]}
        >
          <Button
            label={primaryLabel}
            variant="filled"
            onPress={!disabledPrimary ? onPrimaryPress : undefined}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 8,
  },
  discountInfo: {
    marginBottom: 4,
    gap: 2,
  },
  textWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    width: "100%",
  },
  buttonContainer: {
    flex: 1,
  },
});

export default FooterSummary;
