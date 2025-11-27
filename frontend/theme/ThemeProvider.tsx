import React, { createContext, useContext, useState, ReactNode } from "react";
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
  const [mode, setMode] = useState<ThemeType>("light");

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
