import { useColorScheme } from "react-native";
import { darkTheme } from "./dark";
import { lightTheme } from "./light";

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
}
