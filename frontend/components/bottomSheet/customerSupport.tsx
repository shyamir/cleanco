// src/components/bottomSheet/ContactBottomSheet.tsx
import React, { useEffect, useState } from "react";
import { View, StyleSheet, Linking, Alert, ActivityIndicator } from "react-native";
import Button from "@/components/button";
import { useTheme } from "@/theme/ThemeProvider";
import Base from "./base";
import { Icon } from "@/constants/icon";
import { settingsApi, SupportContacts } from "@/services/settingsService";

type CustomerSupportProps = {
  visible: boolean;
  onClose: () => void;
  onCallPress?: () => void;
  onWhatsappPress?: () => void;
};

const CustomerSupport: React.FC<CustomerSupportProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const [contacts, setContacts] = useState<SupportContacts | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && !contacts) {
      fetchSupportContacts();
    }
  }, [visible]);

  const fetchSupportContacts = async () => {
    try {
      setIsLoading(true);
      const data = await settingsApi.getSupportContacts();
      setContacts(data);
    } catch (error) {
      console.error("Failed to fetch support contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (!contacts?.phone) {
      Alert.alert("Support number not available");
      return;
    }
    Linking.openURL(`tel:${contacts.phone}`);
  };

  const handleWhatsapp = () => {
    if (!contacts?.whatsapp) {
      Alert.alert("WhatsApp number not available");
      return;
    }
    const url = `whatsapp://send?phone=${contacts.whatsapp}`;
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
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.system.body.default} />
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <Button
            label="Whatsapp"
            variant="filled"
            onPress={handleWhatsapp}
            icon={<Icon.whatsapp color={theme.colors.button.label.default} />}
            iconPosition="left"
            disabled={!contacts?.whatsapp}
          />

          <Button
            label="Call"
            variant="outline"
            onPress={handleCall}
            icon={<Icon.call color={theme.colors.button.label.secondary} />}
            iconPosition="left"
            disabled={!contacts?.phone}
          />
        </View>
      )}
    </Base>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "column",
    gap: 12,
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
});

export default CustomerSupport;
