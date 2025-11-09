import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ToastAndroid,
  Platform,
  TextInput,
  TouchableOpacity,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Icon } from "@/constants/icon";
import CollapsibleCard from "../card/collapsibleCard";
import { useTheme } from "@/theme/useTheme";
import TextField from "../inputs/textfield";
import UploadImage from "../uploadImage";

const PaymentGroup = () => {
  const theme = useTheme();

  const [expandedCard, setExpandedCard] = useState<"bank" | "card">("bank");

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCVC] = useState("");

  const [copied, setCopied] = useState(false);

  const toggleCard = (card: "bank" | "card") => {
    if (expandedCard !== card) setExpandedCard(card);
  };

  const bankAccountNumber = "1234 5678 9087"; // Replace with your account number

  const handleCopyAccount = async () => {
    await Clipboard.setStringAsync(bankAccountNumber);
    setCopied(true);

    if (Platform.OS === "android") {
      ToastAndroid.show("Copied successfully!", ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied successfully!");
    }

    setTimeout(() => setCopied(false), 2000);
  };

  const cardRef = useRef<TextInput>(null);
  const expiryRef = useRef<TextInput>(null);
  const cvcRef = useRef<TextInput>(null);

  const validateCardNumber = (number: string) =>
    number.replace(/\s/g, "").length === 16;
  const validateExpiry = (text: string) => /^\d{2}\/\d{2}$/.test(text);
  const validateCVC = (text: string) => text.length >= 3 && text.length <= 4;

  return (
    <View style={styles.container}>
      <CollapsibleCard
        title="Bank Transfer"
        icon={<Icon.bank color={theme.colors.system.body.disabled} />}
        expanded={expandedCard === "bank"}
        onToggle={() => toggleCard("bank")}
      >
        <View style={styles.transferContainer}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text
                style={[
                  theme.typography.body.md.regular,
                  { color: theme.colors.system.body.disabled },
                ]}
              >
                Bank
              </Text>
              <Text
                style={[
                  theme.typography.body.md.regular,
                  { color: theme.colors.system.body.tertiary },
                ]}
              >
                Bank of Maldives
              </Text>
            </View>
            <View style={styles.column}>
              <Text
                style={[
                  theme.typography.body.md.regular,
                  { color: theme.colors.system.body.disabled },
                ]}
              >
                Account name
              </Text>
              <Text
                style={[
                  theme.typography.body.md.regular,
                  { color: theme.colors.system.body.tertiary },
                ]}
              >
                Cleanco Pvt Ltd
              </Text>
            </View>
          </View>

          {/* Account Number with Copy */}
          <View style={styles.accountContainer}>
            <Text
              style={[
                theme.typography.body.md.regular,
                {
                  color: theme.colors.system.body.disabled,
                },
              ]}
            >
              Account number
            </Text>
            <TouchableOpacity
              style={[
                styles.accountRow,
                { backgroundColor: theme.colors.input.background.secondary },
              ]}
              onPress={handleCopyAccount}
            >
              <Text
                style={[
                  theme.typography.body.md.regular,
                  { color: theme.colors.system.body.tertiary },
                ]}
              >
                {bankAccountNumber}
              </Text>
              {copied ? (
                <Icon.check color={theme.colors.system.body.disabled} />
              ) : (
                <Icon.copy color={theme.colors.system.body.default} />
              )}
            </TouchableOpacity>
          </View>
          <UploadImage />
        </View>
      </CollapsibleCard>

      <CollapsibleCard
        title="Credit/Debit Card"
        icon={<Icon.card color={theme.colors.system.body.disabled} />}
        expanded={expandedCard === "card"}
        onToggle={() => toggleCard("card")}
      >
        <View style={styles.cardContainer}>
          <TextField
            ref={cardRef}
            label="Card number*"
            variant="onCard"
            placeholder="1234 5678 1234 5678"
            value={cardNumber}
            keyboardType="numeric"
            onChangeText={(text) => {
              const formatted = text
                .replace(/\D/g, "")
                .slice(0, 16)
                .replace(/(\d{4})/g, "$1 ")
                .trim();
              setCardNumber(formatted);
              if (
                formatted.replace(/\s/g, "").length === 16 &&
                validateCardNumber(formatted)
              ) {
                expiryRef.current?.focus();
              }
            }}
          />

          <View style={styles.cardRow}>
            <TextField
              ref={expiryRef}
              label="Exp. date*"
              variant="onCard"
              placeholder="MM/YY"
              value={expiry}
              keyboardType="numeric"
              onChangeText={(text) => {
                let formatted = text.replace(/\D/g, "");
                if (formatted.length > 2)
                  formatted =
                    formatted.slice(0, 2) + "/" + formatted.slice(2, 4);
                setExpiry(formatted);
                if (validateExpiry(formatted)) cvcRef.current?.focus();
              }}
              style={{ flex: 7 }}
            />
            <TextField
              ref={cvcRef}
              label="CVC*"
              variant="onCard"
              placeholder="123"
              value={cvc}
              keyboardType="numeric"
              onChangeText={(text) =>
                setCVC(text.replace(/\D/g, "").slice(0, 4))
              }
              style={{ flex: 3 }}
            />
          </View>
        </View>
      </CollapsibleCard>
    </View>
  );
};

const styles = StyleSheet.create({
  transferContainer: {
    flexDirection: "column",
    gap: 12,
  },
  wrapper: {
    flexDirection: "column",
  },
  container: { flexDirection: "column", width: "100%", gap: 12 },
  cardContainer: { flexDirection: "column", gap: 12 },
  cardRow: { flexDirection: "row", gap: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  column: { flexDirection: "column", width: "50%", marginBottom: 8 },
  accountContainer: { gap: 4 },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 48,
  },
});

export default PaymentGroup;
