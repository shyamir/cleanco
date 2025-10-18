import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import React from "react";
import Splash from "./splash";

export default function Index() {
  const [fontsLoaded] = useFonts({
    GeomanistMedium: require("../assets/fonts/GeomanistMedium.ttf"),
    InterMedium: require("../assets/fonts/Inter-Medium.ttf"),
    InterRegular: require("../assets/fonts/Inter-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return null; // or <AppLoading /> if you prefer
  }

  return <Splash />; // render splash UI
}
