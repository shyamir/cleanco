import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/useTheme";
import { useNavigation } from "expo-router";
import { Icon } from "@/constants/icon";
import GradientText from "@/components/gradientText";
import FooterSummary from "@/components/footerSummary";
import useCleaningBooking from "./hooks/useCleaningBooking";
import { useBooking } from "@/context/booking-context";
import CollapsibleCardGroup from "@/components/paymentGroup";


const Payment = () => {
  const theme = useTheme();
  const navigation = useNavigation();

  const { total } = useCleaningBooking();
  const { frequency } = useBooking(); 

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <SafeAreaView style={styles.safeAreaContent} edges={["top"]}>
          <View style={styles.contentWrapper}>
            <Image
              source={require("@/assets/images/payment.png")}
              style={styles.image}
              resizeMode="cover"
            />

            <ScrollView contentContainerStyle={styles.scroll}>
              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Icon.back color={theme.colors.system.body.default} />
              </TouchableOpacity>

              {/* Header */}
              <View style={styles.header}>
                <GradientText
                  text="Payment"
                  colors={theme.colors.system.heading.default}
                  variant={theme.typography.heading.sm}
                />
                <GradientText
                  text="Method"
                  colors={theme.colors.system.heading.default}
                  variant={theme.typography.heading.sm}
                />
              </View>
              <CollapsibleCardGroup/>

            </ScrollView>
          </View>
        </SafeAreaView>

        {/* Footer outside the SafeArea so it sits flush at bottom */}
        <FooterSummary
          total={total}
          frequency={frequency}
          currency="MVR"
          primaryLabel="Confirm"
          secondaryLabel="Back"
          onPrimaryPress={() => console.log("Confirm pressed")}
          onSecondaryPress={() => navigation.goBack()}
        />
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeAreaContent: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  image: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "column",
    gap: 8,
    marginBottom: 24,
  },
});

export default Payment;
