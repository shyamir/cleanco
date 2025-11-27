import React, { useRef } from "react";
import { View, StyleSheet, Animated, Text } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";

/* --- Components --- */
import AnimatedHeader from "@/components/animatedHeader";
import ToggleCard from "@/components/card/toggleCard";
import FooterSummary from "@/components/footerSummary";
import TextField from "@/components/inputs/textfield";
import InstructionsCard from "@/components/card/instructionsCard";
import ScheduleSelector from "@/components/scheduleSelector";
import PropertyDetailsCard from "@/components/card/propertyDetailsCard";
import AddressCard from "@/components/card/addressCard";

/* --- Context/Hooks --- */
import { useAddress } from "../context/address-context";
import { useBooking } from "@/context/booking-context";
import useCleaningBooking from "./hooks/useCleaningBooking";
import SquareFeetCard from "@/components/card/squareFeetCard";

const OfficeCleaningScreen = () => {
  const {theme} = useTheme();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  /* --- Booking Context --- */
  const {
    bedrooms,
    setBedrooms,
    bathrooms,
    setBathrooms,
    pet,
    setPet,
    otherPet,
    setOtherPet,
    instructions,
    setInstructions,
    frequency,
    setFrequency,
    total,
    setTotal,
    setService,
  } = useBooking();

  /* --- Address Context --- */
  const { selected } = useAddress();

  /* --- Cleaning Booking Hook --- */
  const { step, setStep, slots, setSlots, handleNext, isSelectionValid } =
    useCleaningBooking();

  return (
    <SafeAreaProvider>
      <LinearGradient
        colors={theme.colors.system.background.tertiary}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          {/* Animated Header */}
          <AnimatedHeader
            title="Office Cleaning"
            scrollY={scrollY}
            animatedImage={require("@/assets/images/office-cleaning.png")}
          />

          {/* Scrollable Content */}
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
                  {/* Address */}
                  <AddressCard
                    title="Address"
                    address={selected?.label || ""}
                    onPress={() => router.push("/address-search")}
                  />

                  {/* Bedrooms/Bathrooms */}
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

                  {/* Frequency */}
                  <ToggleCard
                    title="How Often"
                    options={["Once", "1x /week", "2x /week", "3x /week"]}
                    initialValue={frequency}
                    onChange={setFrequency}
                  />

                  {/* Pets */}
                  <ToggleCard
                    title="Pets"
                    options={["None", "Cat", "Dog", "Fish", "Bird", "Other"]}
                    initialValue={pet}
                    onChange={setPet}
                  >
                    {pet === "Other" && (
                      <TextField
                        label="Please specify"
                        variant="onCard"
                        placeholder="Type here..."
                        value={otherPet}
                        onChangeText={setOtherPet}
                      />
                    )}
                  </ToggleCard>

                  {/* Special Instructions */}
                  <InstructionsCard
                    title="Special Instructions"
                    value={instructions}
                    onChangeText={setInstructions}
                  />
                </View>
              ) : (
                <ScheduleSelector frequency={frequency} onChange={setSlots} />
              )}
            </View>
          </Animated.ScrollView>

          {/* Footer */}
          <FooterSummary
            total={total}
            frequency={frequency}
            primaryLabel={step === "selection" ? "Next" : "Review"}
            onPrimaryPress={
              step === "selection"
                ? handleNext
                : () => {
                    setService("Office Cleaning");
                    router.push("/review");
                  }
            }
            secondaryLabel="Back"
            onSecondaryPress={
              step === "selection"
                ? () => router.push("/home")
                : () => setStep("selection")
            }
            disabledPrimary={step === "schedule" && !isSelectionValid()}
          />
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
