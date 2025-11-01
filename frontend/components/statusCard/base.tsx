import React from "react";
import LinearGradient from "react-native-linear-gradient";
import { StyleSheet } from "react-native";
import { useTheme } from "@/theme/useTheme";

type BaseProps = {
  colors: string[];
  children: React.ReactNode;
};

const Base: React.FC<BaseProps> = ({ children }) => {
  const theme = useTheme();

  return (
    <LinearGradient
      colors={theme.colors.card.background.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    justifyContent: "center",
    height: 255,
  
  },
});

export default Base;
