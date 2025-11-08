import React, { useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

/* --- Theme ---*/
import { useTheme } from "@/theme/useTheme";

/* --- Routing ---*/
import { useRouter } from "expo-router";

/* --- Components ---*/
import AnimatedHeader from "../components/animatedHeader";
import ToggleCard from "@/components/card/toggleCard";
import FooterSummary from "@/components/footerSummary";
import InstructionsCard from "@/components/card/instructionsCard";
import ScheduleSelector from "@/components/scheduleSelector";
import PropertyDetailsCard from "@/components/card/propertyDetailsCard";
import SquareFeetCard from "@/components/card/squareFeetCard";

/* --- Hook ---*/
import useCleaningBooking from "./hooks/useCleaningBooking";
import { useBooking } from "@/context/booking-context";

const OfficeCleaningScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const {
    step,
    setStep,
    frequency,
    setFrequency,
    bedrooms,
    setBedrooms,
    bathrooms,
    setBathrooms,
    total,
    setSlots,
    handleNext,
    isSelectionValid,
  } = useCleaningBooking();


  const {

    instructions,
    setInstructions
  } = useBooking();

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
            contentContainerStyle={{ paddingTop: 86, flexGrow: 1 }}
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
                <View style={styles.body}>
                  <PropertyDetailsCard
                    title="Office Details"
                    primaryLabel="Rooms"
                    secondaryLabel="Washrooms"
                    primaryValue={bedrooms}
                    secondaryValue={bathrooms}
                    onPrimaryChange={setBedrooms}
                    onSecondaryChange={setBathrooms}
                  />
                  <SquareFeetCard
                    initialValue={150}
                    onChange={(val) => {
                      console.log("Square feet selected:", val);
                      // Add pricing logic for square feet here if needed
                    }}
                  />
                  <ToggleCard
                    title="How Often"
                    options={["Once", "1x /week", "2x /week", "3x /week"]}
                    initialValue={frequency}
                    onChange={setFrequency}
                  />
                  <InstructionsCard
                    title="Special Instructions"
                    value={instructions}
                    onChangeText={setInstructions}
                  />{" "}
                </View>
              ) : (
                <ScheduleSelector
                  frequency={frequency}
                  onChange={(updated) => setSlots(updated)}
                />
              )}
            </View>
          </Animated.ScrollView>

          {/* Footer */}
          {step === "selection" ? (
            <FooterSummary
              total={total}
              currency="MVR"
              primaryLabel="Next"
              onPrimaryPress={handleNext}
              secondaryLabel="Back"
              onSecondaryPress={() => router.push("/home")}
            />
          ) : (
            <FooterSummary
              total={total}
              currency="MVR"
              primaryLabel="Review"
              onPrimaryPress={() => router.push("/review")}
              secondaryLabel="Back"
              onSecondaryPress={() => setStep("selection")}
              disabled={!isSelectionValid()}
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
  body: { flexDirection: "column", gap: 8 },
  whiteArea: {
    flexDirection: "column",
    gap: 8,
    flex: 1,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
});

export default OfficeCleaningScreen;
