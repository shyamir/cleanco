import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkTheme } from "./dark";
import { lightTheme } from "./light";

type ThemeType = "light" | "dark";

interface ThemeContextProps {
  theme: typeof lightTheme;
  mode: ThemeType;
  setMode: (mode: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [mode, setModeState] = useState<ThemeType>("light");

  useEffect(() => {
    const loadTheme = async () => {
      const savedMode = await AsyncStorage.getItem("themeMode");
      if (savedMode === "dark" || savedMode === "light") {
        setModeState(savedMode);
      }
    };
    loadTheme();
  }, []);

  const setMode = async (newMode: ThemeType) => {
    setModeState(newMode);
    await AsyncStorage.setItem("themeMode", newMode);
  };

  const theme = mode === "dark" ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
