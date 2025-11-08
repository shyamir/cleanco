import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Button from "@/components/button";
import { useTheme } from "@/theme/useTheme";

type FooterSummaryProps = {
  total?: number;
  currency?: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimaryPress: () => void;
  onSecondaryPress: () => void;
  disabled?: boolean;
};

const FooterSummary: React.FC<FooterSummaryProps> = ({
  total,
  currency = "MVR",
  primaryLabel,
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress,
  disabled = false,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.footer,
        { backgroundColor: theme.colors.system.background.secondary },
      ]}
    >
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
        </View>
      </View>

      {/* Always show two buttons side by side */}
      <View style={styles.buttonRow}>
        <View style={styles.buttonContainer}>
          <Button
            label={secondaryLabel}
            variant="outline"
            onPress={onSecondaryPress}
          />
        </View>
        <View style={[styles.buttonContainer, disabled && { opacity: 0.5 }]}>
          <Button
            label={primaryLabel}
            variant="filled"
            onPress={!disabled ? onPrimaryPress : undefined} // disable press
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
