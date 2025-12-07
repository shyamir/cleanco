import React, { useState, useRef, useEffect } from "react";
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
import { useTheme } from "@/theme/ThemeProvider";
import UploadImage from "../uploadImage";
import { useBooking } from "@/context/booking-context";
import { PaymentMethod } from "@/services/bookingService";

type PaymentGroupProps = {
  onValidationChange?: (isValid: boolean) => void;
};

const PaymentGroup: React.FC<PaymentGroupProps> = ({ onValidationChange }) => {
  const { theme } = useTheme();
  const { setPaymentMethod } = useBooking();

  // Only bank transfer is enabled for now
  const [expandedCard, setExpandedCard] = useState<"bank" | "card">("bank");

  // Card fields
  // const [cardNumber, setCardNumber] = useState("");
  // const [expiry, setExpiry] = useState("");
  // const [cvc, setCVC] = useState("");

  // Bank upload
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  const toggleCard = (card: "bank" | "card") => {
    // Credit card is disabled for now
    if (card === "card") {
      return;
    }
    if (expandedCard !== card) {
      setExpandedCard(card);
      // Update payment method in booking context
      setPaymentMethod(PaymentMethod.BANK_TRANSFER);
    }
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
  const validateCVC = (text: string) => text.length >= 3 && text.length <= 4;

  const validateExpiry = (text: string) => {
    // Check MM/YY format
    if (!/^\d{2}\/\d{2}$/.test(text)) return false;

    const [monthStr, yearStr] = text.split("/");
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    if (month < 1 || month > 12) return false; // invalid month

    // Get current month/year
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 0-indexed
    const currentYear = now.getFullYear() % 100; // last 2 digits

    // Expiry must be this month or later
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return true;
  };

  useEffect(() => {
    let isValid = false;

    if (expandedCard === "bank") {
      isValid = !!uploadedImage; // must have uploaded slip
    } else if (expandedCard === "card") {
      isValid = true; // ✅ always valid when card option is selected
    }

    onValidationChange?.(isValid);
  }, [expandedCard, uploadedImage]);

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

          <UploadImage onUploadSuccess={(uri) => setUploadedImage(uri)} />
        </View>
      </CollapsibleCard>

      <CollapsibleCard
        title="Credit/Debit Card"
        icon={<Icon.card color={theme.colors.system.body.disabled} />}
        expanded={false}
        onToggle={() => toggleCard("card")}
        disabled
        badge="Coming soon"
      >
        <View style={styles.cardContainer}>
          <Text
            style={[
              theme.typography.body.md.regular,
              { color: theme.colors.system.body.disabled },
            ]}
          >
            Credit/Debit card payments coming soon
          </Text>
        </View>
      </CollapsibleCard>
    </View>
  );
};

const styles = StyleSheet.create({
  transferContainer: { flexDirection: "column", gap: 12 },
  wrapper: { flexDirection: "column" },
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
