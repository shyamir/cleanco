// src/components/bottomSheet/ContactBottomSheet.tsx
import React from "react";
import { View, StyleSheet, Linking, Alert } from "react-native";
import Button from "@/components/button";
import { useTheme } from "@/theme/ThemeProvider";
import Base from "./base";
import { Icon } from "@/constants/icon";

type CustomerSupportProps = {
  visible: boolean;
  onClose: () => void;
  onCallPress: () => void;
  onWhatsappPress: () => void;
};

const SUPPORT_PHONE_NUMBER = "+94770763080"; // 👈 Replace with real support number

const CustomerSupport: React.FC<CustomerSupportProps> = ({
  visible,
  onClose,
  onCallPress,
  onWhatsappPress,
}) => {
  const {theme} = useTheme();
const handleCall = () => {
  Linking.openURL(`tel:${SUPPORT_PHONE_NUMBER}`);
};

const handleWhatsapp = () => {
  const url = `whatsapp://send?phone=${SUPPORT_PHONE_NUMBER}`;
  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("WhatsApp is not installed on this device");
      }
    })
    .catch((err) => console.error("Error opening WhatsApp:", err));
};
  return (
    <Base
      visible={visible}
      onClose={onClose}
      title="Customer Support"
      backgroundColor={theme.colors.system.background.default}
    >
      <View style={styles.buttonContainer}>
        <Button
          label="Whatsapp"
          variant="filled"
          onPress={handleWhatsapp}
          icon={<Icon.whatsapp color={theme.colors.button.label.default} />}
          iconPosition="left"
        />

        <Button
          label="Call"
          variant="outline"
          onPress={handleCall}
          icon={<Icon.call color={theme.colors.button.label.secondary} />}
          iconPosition="left"
        />
      </View>
    </Base>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "column",
    gap: 12,
    marginTop: 8,
  },
});

export default CustomerSupport;
