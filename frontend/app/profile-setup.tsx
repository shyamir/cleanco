import React, { useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
  useColorScheme,
  TextInput,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

/* --- Constants ---*/
import { TABS_DATA } from "@/constants/tabData";

/* --- Theme ---*/
import { useTheme } from "@/theme/ThemeProvider";

/* --- Hook ---*/
import GradientText from "@/components/gradientText";
import PrefixedTextField from "@/components/inputs/predefinedTextField";
import Button from "@/components/button";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TextField from "@/components/inputs/textfield";

export default function ProfileSetup() {
const {theme, mode} = useTheme();
  const router = useRouter();

  const scheme = useColorScheme(); // detect light/dark

  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const fullNameRef = useRef<any>(null);
  const emailRef = useRef<any>(null);

  // Helper for email validation
  const isEmailValid = (email: string) => {
    if (!email) return true; // optional, empty is fine
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Form is valid if fullName is filled
  const isFormValid = fullName.trim() !== "";

  // Show email error only if user typed something and it's invalid
  const emailError =
    email && !isEmailValid(email) ? "Please enter a valid email" : undefined;

  // Inside handleNext
  const handleNext = async () => {
    if (!isFormValid) return;

    const firstName = fullName.trim().split(" ")[0];

    await AsyncStorage.setItem("firstName", firstName);
    await AsyncStorage.setItem("fullName", fullName);
    await AsyncStorage.setItem("email", email);
    // await AsyncStorage.setItem("phone", phone);

    router.push("/home");
  };


  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.system.background.default },
        ]}
      >
        <Image
          source={
            mode === "dark"
              ? require("@/assets/images/dark-logo.png")
              : require("@/assets/images/light-logo.png")
          }
          style={styles.image}
          resizeMode="contain"
        />

        <View style={styles.header}>
          <GradientText
            variant={theme.typography.heading.md}
            text="Profile"
            colors={theme.colors.system.heading.secondary}
          />
          <Text
            style={[
              {
                ...theme.typography.heading.md,
                color: theme.colors.system.heading.tertiary,
              } as any,
            ]}
          >
            Setup
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.body}>
            {/* Full Name Field */}
            <TextField
              ref={fullNameRef}
              label="Full Name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              required
              autoFocus
              onSubmitEditing={() => emailRef.current?.focus()}
            />

            {/* Email Field */}
            {/* <TextField
              ref={emailRef}
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              error={emailError}
              onSubmitEditing={handleNext}
            /> */}
            <TextField
              ref={emailRef}
              label="Email"
              placeholder="Enter your email"
              value={email}
              keyboardType="email-address"
              error={emailError}
              onChangeText={(text) => {
                // convert to lowercase
                let cleaned = text.toLowerCase();

                // allow only letters, @, and .
                cleaned = cleaned.replace(/[^a-z@.]/g, "");

                // prevent more than one "@"
                const atParts = cleaned.split("@");
                if (atParts.length > 2) {
                  cleaned =
                    atParts[0] +
                    "@" +
                    atParts.slice(1).join("").replace(/@/g, "");
                }

                // remove leading "@"
                if (cleaned.startsWith("@")) cleaned = cleaned.substring(1);

                // remove leading "."
                if (cleaned.startsWith(".")) cleaned = cleaned.substring(1);

                // collapse multiple dots → "."
                cleaned = cleaned.replace(/\.\.+/g, ".");

                // prevent "@." (email can't jump directly to dot)
                cleaned = cleaned.replace(/@\.*/, "@");

                setEmail(cleaned);
              }}
              onSubmitEditing={handleNext}
            />
          </View>

          <View style={styles.footer}>
            <View style={{ opacity: !isFormValid ? 0.5 : 1 }}>
              <Button
                label="Next"
                variant="filled"
                // onPress={() => {
                //   if (isFormValid) router.push("/home"); // only fullName is required
                // }}
                onPress={handleNext}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 48,
    flexDirection: "column",
    gap: 48,
  },
  header: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  image: {
    width: "40%",
  },
  body: {
    flexDirection: "column",
    gap: 16,
  },
  footer: {
    flexDirection: "column",
    gap: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80, // Space for bottom tabs
    gap: 48,
  },
});
