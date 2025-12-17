import React, { useRef, useEffect } from "react";
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
    squareFeet,
    setSquareFeet,
    rooms,
    setRooms,
    toilets,
    setToilets,
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
    isEstimate,
    setIsEstimate,
  } = useBooking();

  /* --- Address Context --- */
  const { selected } = useAddress();

  /* --- Cleaning Booking Hook --- */
  const { step, setStep, slots, setSlots, handleNext, isSelectionValid } =
    useCleaningBooking();

  // Set service type on mount so useCleaningBooking skips HOME pricing
  useEffect(() => {
    setService("Office Cleaning");
    setIsEstimate(true);
  }, [setService, setIsEstimate]);

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
            onBack={
              step === "selection"
                ? () => router.push("/home")
                : () => setStep("selection")
            }
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
                    address={selected?.id ? selected.label : "No address selected"}
                    onPress={() =>
                      router.push({
                        pathname: "/address-search",
                        params: { returnTo: "office-cleaning" },
                      })
                    }
                  />

                  {/* Square Feet */}
                  <SquareFeetCard
                    initialValue={squareFeet}
                    onChange={(val) => {
                      setSquareFeet(val);
                      setIsEstimate(true); // Office bookings are estimates
                    }}
                  />

                  {/* Rooms/Toilets */}
                  <PropertyDetailsCard
                    title="Office Details"
                    primaryLabel="Rooms"
                    secondaryLabel="Toilets"
                    primaryValue={rooms}
                    secondaryValue={toilets}
                    onPrimaryChange={setRooms}
                    onSecondaryChange={setToilets}
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

          {/* Footer - hidePrice since office quote is shown on review page */}
          <FooterSummary
            hidePrice={true}
            frequency={frequency}
            primaryLabel={step === "selection" ? "Next" : "Review"}
            onPrimaryPress={
              step === "selection"
                ? handleNext
                : () => router.push("/review")
            }
            secondaryLabel="Back"
            onSecondaryPress={
              step === "selection"
                ? () => router.push("/home")
                : () => setStep("selection")
            }
            disabledPrimary={
              step === "selection"
                ? !selected?.id  // Disable Next if no address selected
                : !isSelectionValid()  // Disable Review if schedule not valid
            }
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
