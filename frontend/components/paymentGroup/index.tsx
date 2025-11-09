import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Icon } from "@/constants/icon";
import CollapsibleCard from "../card/collapsibleCard";
import { useTheme } from "@/theme/useTheme";

const PaymentGroup = () => {
  const theme = useTheme();

  // Start with "bank" open by default
  const [expandedCard, setExpandedCard] = useState<"bank" | "card">("bank");

  const toggleCard = (card: "bank" | "card") => {
    if (expandedCard !== card) {
      setExpandedCard(card); // switch to the other card
    }
    // if the same card is clicked, do nothing
  };

  return (
    // <ScrollView>
      <View style={styles.container}>
        <CollapsibleCard
          title="Bank Transfer"
          icon={<Icon.notes color={theme.colors.system.body.disabled} />}
          expanded={expandedCard === "bank"}
          onToggle={() => toggleCard("bank")}
        >
          <Text>Bank transfer details go here...</Text>
        </CollapsibleCard>

        <CollapsibleCard
          title="Credit/Debit Card"
          icon={<Icon.notes color={theme.colors.system.body.disabled} />}
          expanded={expandedCard === "card"}
          onToggle={() => toggleCard("card")}
        >
          <Text>Card payment form goes here...</Text>
        </CollapsibleCard>
      </View>
    // </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },

});

export default PaymentGroup;
