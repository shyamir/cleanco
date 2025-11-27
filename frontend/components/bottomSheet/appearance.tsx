import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import Base from "./base";
import ToggleButton from "@/components/toggleButton";
import Button from "@/components/button";
import { useTheme } from "@/theme/useTheme";
import { Icon } from "@/constants/icon";

type AppearanceProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (mode: "light" | "dark") => void;
  currentTheme: "light" | "dark";
};

const Appearance: React.FC<AppearanceProps> = ({
  visible,
  onClose,
  onSave,
  currentTheme,
}) => {
  const theme = useTheme();

  // Set the selected option based on current theme
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">(
    currentTheme
  );

  const isChanged = selectedTheme !== currentTheme;

  return (
    <Base
      visible={visible}
      onClose={onClose}
      title="Appearance"
      backgroundColor={theme.colors.system.background.default}
    >
      <View style={styles.row}>
        <ToggleButton
          label="Light Mode"
          selected={selectedTheme === "light"}
          onPress={() => setSelectedTheme("light")}
          icon={<Icon.sun />}
          style={styles.toggle}
        />
        <ToggleButton
          label="Dark Mode"
          selected={selectedTheme === "dark"}
          onPress={() => setSelectedTheme("dark")}
          icon={<Icon.moon />}
          style={styles.toggle}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          label="Save"
          variant="filled"
          onPress={() => {
            if (isChanged) onSave(selectedTheme); // Trigger theme update
            onClose(); // Close bottom sheet
          }}
        />

        <Button label="Cancel" variant="outline" onPress={onClose} />
      </View>
    </Base>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 12,
    marginTop: 16,
  },
  toggle: {
    flexDirection: "column",
    gap: 12,
    height: "auto",
    borderRadius: 12,
    paddingVertical: 12,
  },
});

export default Appearance;
