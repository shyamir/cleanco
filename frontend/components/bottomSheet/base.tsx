// src/components/bottomSheet/Base.tsx
import { useTheme } from "@/theme/useTheme";
import React from "react";
import { View, Modal, Text, StyleSheet, Pressable } from "react-native";

type BaseProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  backgroundColor?: string;
  sheetStyle?: object;
  title?: string;
};

const Base: React.FC<BaseProps> = ({
  visible,
  onClose,
  children,
  title,
  backgroundColor,
  sheetStyle,
}) => {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {/* Overlay moved here */}
      <Pressable style={styles.overlay} onPress={onClose} />

      <View style={[styles.sheet, { backgroundColor }, sheetStyle]}>
        {title && (
          <Text
            style={[
              theme.typography.heading.xs3.book,
              {
                color: theme.colors.system.body.default,
                marginBottom: 12,
              },
            ]}
          >
            {title}
          </Text>
        )}

        {children}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
});

export default Base;
