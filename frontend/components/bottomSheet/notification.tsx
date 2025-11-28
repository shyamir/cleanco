// src/components/bottomSheet/NotificationBottomSheet.tsx
import React, { useState, useRef } from "react";
import { View, StyleSheet, Text, Switch } from "react-native";
import Base from "./base";
import Button from "@/components/button";
import { useTheme } from "@/theme/ThemeProvider";

type NotificationProps = {
  visible: boolean;
  onClose: () => void;
  initialValue?: boolean;
  onSave: (value: boolean) => void;
};

const Notification: React.FC<NotificationProps> = ({
  visible,
  onClose,
  initialValue = false,
  onSave,
}) => {
  const {theme} = useTheme();
  const [enabled, setEnabled] = useState(initialValue);
  const initialRef = useRef(initialValue);

  const isDisabled = enabled === initialRef.current; // 🔥 Save button disabled until change

  const handleSave = () => {
    if (!isDisabled) {
      onSave(enabled);
      onClose();
    }
  };

  return (
    <Base
      visible={visible}
      onClose={onClose}
      title="Notifications"
      backgroundColor={theme.colors.system.background.default}
    >
      <View style={styles.row}>
        <Text
          style={[
            theme.typography.body.md.regular,
            { color: theme.colors.system.body.default },
          ]}
        >
          Push Notifications
        </Text>

        <Switch
          value={enabled}
          onValueChange={setEnabled}
          thumbColor={enabled ? "#fff" : "#fff"}
          trackColor={{
            false: theme.colors.system.body.disabled,
            true: theme.colors.system.body.active,
          }}
        />
      </View>

      <View style={styles.buttonContainer}>
        <View style={{ opacity: isDisabled ? 0.5 : 1 }}>
          <Button
            label="Save"
            variant="filled"
            onPress={handleSave}
            // disabled={isDisabled} // prevents interaction
          />
        </View>

        <Button label="Cancel" variant="outline" onPress={onClose} />
      </View>
    </Base>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },

  label: {
    fontSize: 16,
    fontWeight: "500",
  },

  buttonContainer: {
    flexDirection: "column",
    gap: 12,
    marginTop: 8,
  },
});

export default Notification;
