import React, { useRef, useState } from "react";
import { View, StyleSheet, Animated, Text, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/useTheme";
import AnimatedHeader from "../components/animatedHeader";
import FrequencyCard from "@/components/card/toggleCard";
import ToggleCard from "@/components/card/toggleCard";
import Button from "@/components/button";
import FooterSummary from "@/components/footerSummary";
import { useRouter } from "expo-router";

const OfficeCleaningScreen = () => {
  const theme = useTheme();
  const router = useRouter(); // 👈 initialize router

  const scrollY = useRef(new Animated.Value(0)).current;
  const [step, setStep] = useState<"selection" | "schedule">("selection");

  return (
    <SafeAreaProvider>
      <LinearGradient
        colors={theme.colors.system.background.tertiary}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <AnimatedHeader
            title="Office Cleaning"
            scrollY={scrollY}
            animatedImage={require("@/assets/images/office-cleaning.png")}
          />
          <Animated.ScrollView
            contentContainerStyle={{
              paddingTop: 86,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            <View
              style={[
                styles.whiteArea,
                { backgroundColor: theme.colors.system.background.default },
              ]}
            >
              {step === "selection" ? (
                <>
                  <ToggleCard
                    title="How Often"
                    options={["Once", "1x /week", "2x /week", "3x /week"]}
                    initialValue="Once"
                    onChange={(value) => console.log("Frequency:", value)}
                  />
                </>
              ) : (
                <>
                  <ToggleCard
                    title="Time"
                    options={[
                      "08:00",
                      "09:00",
                      "10:00",
                      "11:00",
                      "12:00",
                      "13:00",
                      "14:00",
                      "15:00",
                    ]}
                    initialValue="Once"
                    onChange={(value) => console.log("Time:", value)}
                  />
                </>
              )}
            </View>
          </Animated.ScrollView>
          {step === "selection" ? (
            <FooterSummary
              total={435}
              currency="MVR"
              primaryLabel="Next"
              onPrimaryPress={() => setStep("schedule")}
              secondaryLabel="Back"
              onSecondaryPress={() => router.push("/home")}
            />
          ) : (
            <FooterSummary
              total={435}
              currency="MVR"
              primaryLabel="Review"
              onPrimaryPress={() => router.push("/review")}
              secondaryLabel="Back"
              onSecondaryPress={() => setStep("selection")}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  gradientBackground: { flex: 1 },
  safeArea: { flex: 1 },
  whiteArea: {
    flexDirection: "column",
    gap: 8,
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  textWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footer: {
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  priceWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
});

export default OfficeCleaningScreen;
