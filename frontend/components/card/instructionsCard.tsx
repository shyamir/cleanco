import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { Href, useRouter } from "expo-router";
import BaseCard from "./base"; // adjust the path if needed
import TextArea from "../inputs/textArea";

type InstructionsCardProps = {
  title: string;
  value: string;
  onChangeText: (text: string) => void;
};

const InstructionsCard: React.FC<InstructionsCardProps> = ({ title, value, onChangeText }) => {
  const {theme} = useTheme();
  const router = useRouter();

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.touchWrapper}>
      <BaseCard>
        <View style={styles.container}>
          <Text
            style={[
              {
                ...theme.typography.heading.xs4.book,
                color: theme.colors.system.heading.tertiary,
              } as any,
            ]}
          >
            {title}
          </Text>
          <TextArea
            variant="onCard"
            value={value} // <-- use prop
            onChangeText={onChangeText}
            placeholder=""
          />
        </View>
      </BaseCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: 8,
  },
  touchWrapper: {
    // width: "48.8%",
  },
  topSection: {
    flexDirection: "column",
    gap: 4,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bottomSection: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginTop: "auto",
  },
  priceWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
});

export default InstructionsCard;
