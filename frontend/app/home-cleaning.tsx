import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/useTheme";
import AnimatedHeader from "../components/animatedHeader";
import ToggleCard from "@/components/card/toggleCard";
import FooterSummary from "@/components/footerSummary";
import { useRouter } from "expo-router";
import TextField from "@/components/inputs/textfield";
import InstructionsCard from "@/components/card/instructionsCard";
import ScheduleSelector from "@/components/scheduleSelector";
import PropertyDetailsCard from "@/components/card/propertyDetailsCard";
import { CLEANING_PRICING } from "@/constants/pricing";

const HomeCleaningScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [step, setStep] = useState<"selection" | "schedule">("selection");
  const [frequency, setFrequency] = useState("Once");
  const [pet, setPet] = useState("None");
  const [otherPet, setOtherPet] = useState("");
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [total, setTotal] = useState(0);

  type Slot = { day: string; time: string };
  const emptySlots: Slot[] = [
    { day: "", time: "" },
    { day: "", time: "" },
    { day: "", time: "" },
  ];
  const [slots, setSlots] = useState<Slot[]>(emptySlots);

  // Reset slots when frequency changes or when returning to schedule step
  useEffect(() => {
    setSlots(emptySlots);
  }, [frequency]);

  useEffect(() => {
    if (step === "selection") {
      setSlots(emptySlots);
    }
  }, [step]);

  // Validation logic based on frequency
  const isSelectionValid = () => {
    if (frequency === "Once") return !!slots[0].time;
    if (frequency === "1x /week") return !!slots[0].day && !!slots[0].time;
    if (frequency === "2x /week")
      return (
        !!slots[0].day && !!slots[0].time && !!slots[1].day && !!slots[1].time
      );
    if (frequency === "3x /week")
      return (
        !!slots[0].day &&
        !!slots[0].time &&
        !!slots[1].day &&
        !!slots[1].time &&
        !!slots[2].day &&
        !!slots[2].time
      );
    return false;
  };

  const handleNext = () => {
    setStep("schedule");
    setSlots(emptySlots); // Ensure slots clear when entering schedule step fresh
  };

  // Update total whenever bedrooms or frequency change
  useEffect(() => {
    const price = CLEANING_PRICING[bedrooms]?.[frequency] || 435;
    setTotal(price);
  }, [bedrooms, frequency]);

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

export default HomeCleaningScreen;
