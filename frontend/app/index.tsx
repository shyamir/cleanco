import { useFonts } from "expo-font";
import React from "react";
import Splash from "./splash";

export default function Index() {
  const [fontsLoaded] = useFonts({
    GeomanistMedium: require("../assets/fonts/Geomanist-Medium.ttf"),
    GeomanistBook: require("../assets/fonts/Geomanist-Book.ttf"),
    InterMedium: require("../assets/fonts/Inter-Medium.ttf"),
    InterRegular: require("../assets/fonts/Inter-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  // Always show splash - it will handle navigation after video ends
  return <Splash />;
}
