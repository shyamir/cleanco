// src/components/bottomSheet/ContactBottomSheet.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import Button from "@/components/button";
import { useTheme } from "@/theme/useTheme";
import Base from "./base";
import { Icon } from "@/constants/icon";

type CustomerSupportProps = {
  visible: boolean;
  onClose: () => void;
  onCallPress: () => void;
  onWhatsappPress: () => void;
};

const CustomerSupport: React.FC<CustomerSupportProps> = ({
  visible,
  onClose,
  onCallPress,
  onWhatsappPress,
}) => {
  const theme = useTheme();

  return (
    <Base
      visible={visible}
      onClose={onClose}
      title="Customer Support"
      backgroundColor={theme.colors.system.background.secondary}
    >
      <View style={styles.buttonContainer}>
        <Button
          label="Whatsapp"
          variant="filled"
          onPress={onWhatsappPress}
          icon={<Icon.whatsapp color={theme.colors.button.label.default} />}
          iconPosition="left"
        />

        <Button
          label="Call"
          variant="outline"
          onPress={onCallPress}
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
