// import { useTheme } from "@/theme/useTheme";
import { useTheme } from "@/theme/ThemeProvider";
import React from "react";
import { View, StyleSheet } from "react-native";

type BaseProps = {
  children: React.ReactNode;
  style?:any,
};

const Base: React.FC<BaseProps> = ({ children, style}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          ...theme.typography.heading.xs3,
          backgroundColor: theme.colors.system.background.secondary,
        } as any,
        styles.card,
        style, 
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    width: "100%",
  },
});

export default Base;
