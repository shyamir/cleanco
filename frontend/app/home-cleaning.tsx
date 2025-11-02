import React, { useRef, useState } from "react";
import { View, StyleSheet, Animated } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

/* --- Theme ---*/
import { useTheme } from "@/theme/useTheme";

/* --- Routing ---*/
import { useRouter } from "expo-router";

/* --- Components ---*/
import AnimatedHeader from "@/components/animatedHeader";
import ToggleCard from "@/components/card/toggleCard";
import FooterSummary from "@/components/footerSummary";
import TextField from "@/components/inputs/textfield";
import InstructionsCard from "@/components/card/instructionsCard";
import ScheduleSelector from "@/components/scheduleSelector";
import PropertyDetailsCard from "@/components/card/propertyDetailsCard";

  /* --- Hooks ---*/
import useCleaningBooking from "./hooks/useCleaningBooking";

const HomeCleaningScreen = () => {
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

  // Local-only state for pets
  const [pet, setPet] = useState("None");
  const [otherPet, setOtherPet] = useState("");

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
            title="Home Cleaning"
            scrollY={scrollY}
            animatedImage={require("@/assets/images/home-cleaning.png")}
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
                    title="Home Details"
                    primaryLabel="Bedrooms"
                    secondaryLabel="Bathrooms"
                    primaryValue={bedrooms}
                    secondaryValue={bathrooms}
                    onPrimaryChange={setBedrooms}
                    onSecondaryChange={setBathrooms}
                  />

                  <ToggleCard
                    title="How Often"
                    options={["Once", "1x /week", "2x /week", "3x /week"]}
                    initialValue={frequency}
                    onChange={setFrequency}
                  />

                  <ToggleCard
                    title="Pets"
                    options={["None", "Cat", "Dog", "Fish", "Bird", "Other"]}
                    initialValue={pet}
                    onChange={setPet}
                  >
                    {pet === "Other" && (
                      <TextField
                        label="Please specify"
                        placeholder="Type here..."
                        value={otherPet}
                        onChangeText={setOtherPet}
                      />
                    )}
                  </ToggleCard>

                  <InstructionsCard title="Special Instructions" />
                </View>
              ) : (
                <ScheduleSelector frequency={frequency} onChange={setSlots} />
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

export default HomeCleaningScreen;
