import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter, useLocalSearchParams } from "expo-router";
import Button from "@/components/button";
import { Icon } from "@/constants/icon";
import TextField from "@/components/inputs/textfield";
import PrefixedTextField from "@/components/inputs/predefinedTextField";
import { authService } from "@/services/auth";
import { setPhoneNumber } from "@/utils/otpStore";

export default function Profile() {
  const {theme} = useTheme();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Validation
  const isNameValid = fullName.trim() !== "";
  const phoneChanged = phone !== originalPhone && phone.length === 7;

  // Email validation - empty is allowed, but if provided must be valid format
  const emailRegex = /^[a-z0-9.]+@[a-z0-9]+\.[a-z]{2,}$/;
  const isEmailValid = email === "" || emailRegex.test(email);

  // Form is valid when name is valid AND email is valid (or empty)
  const isFormValid = isNameValid && isEmailValid;

  useEffect(() => {
    const loadData = async () => {
      const fn = await AsyncStorage.getItem("fullName");
      const em = await AsyncStorage.getItem("email");
      const ph = await AsyncStorage.getItem("phone"); // read verified phone

      if (fn) setFullName(fn);
      if (em) setEmail(em);
      if (ph) {
        setPhone(ph);
        setOriginalPhone(ph); // Store original to detect changes
      }
    };
    loadData();
  }, []);

  const handleSave = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    try {
      // Split full name into first and last name
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || undefined;

      if (phoneChanged) {
        // Phone number changed - need OTP verification
        // Store pending profile data for after OTP verification
        await AsyncStorage.setItem("pendingProfile", JSON.stringify({
          firstName,
          lastName: lastName || null,
          email: email || null,
        }));

        // Send OTP to new phone number
        const formattedPhone = `+960${phone}`;
        await authService.sendOtp(formattedPhone);

        // Store new phone for OTP screen
        await setPhoneNumber(phone);

        // Navigate to OTP screen with phone-change mode
        router.push({
          pathname: "/otp",
          params: { mode: "phone-change", newPhone: phone },
        });
      } else {
        // No phone change - just update profile via backend
        // Send null explicitly to clear lastName/email if empty
        await authService.updateProfile({
          firstName,
          lastName: lastName || null,
          email: email || null,
        });

        // Update local storage
        await AsyncStorage.setItem("fullName", fullName);
        if (email) {
          await AsyncStorage.setItem("email", email);
        } else {
          await AsyncStorage.removeItem("email");
        }

        router.push("/account");
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to save profile. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <SafeAreaView
          style={[
            styles.container,
            { backgroundColor: theme.colors.system.background.default },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.push("/account")}
              style={styles.backBtn}
            >
              <Icon.back color={theme.colors.system.body.default} />
            </TouchableOpacity>

            <Text
              style={[
                theme.typography.heading.xs,
                { color: theme.colors.system.body.default, marginBottom: 24 },
              ]}
            >
              Profile
            </Text>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.body}>
              <View>
                <TextField
                  label="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                />
                {!isNameValid && fullName === "" && (
                  <Text
                    style={[
                      theme.typography.body.xs.regular,
                      { color: theme.colors.system.body.error || "#dc2626", marginTop: 4 },
                    ]}
                  >
                    This field is required
                  </Text>
                )}
              </View>

              <View>
                <TextField
                  label="Email"
                  value={email}
                  onChangeText={(text) => {
                    // convert to lowercase first
                    let cleaned = text.toLowerCase();

                    // allow only letters, numbers, @ and .
                    cleaned = cleaned.replace(/[^a-z0-9@.]/g, "");

                    // prevent more than ONE @
                    const parts = cleaned.split("@");
                    if (parts.length > 2) {
                      cleaned =
                        parts[0] +
                        "@" +
                        parts.slice(1).join("").replace(/@/g, "");
                    }

                    // prevent TWO dots in a row
                    cleaned = cleaned.replace(/\.\.+/g, ".");

                    // prevent @ as first character
                    if (cleaned.startsWith("@"))
                      cleaned = cleaned.replace("@", "");

                    // prevent . as first character
                    if (cleaned.startsWith("."))
                      cleaned = cleaned.replace(".", "");

                    // prevent dot immediately after @ → turns "@." into "@"
                    cleaned = cleaned.replace(/@\.*/, "@");

                    setEmail(cleaned);
                  }}
                />
                {email !== "" && !isEmailValid && (
                  <Text
                    style={[
                      theme.typography.body.xs.regular,
                      { color: theme.colors.system.body.error || "#dc2626", marginTop: 4 },
                    ]}
                  >
                    Please enter a valid email address
                  </Text>
                )}
              </View>

              <View style={styles.mobileContainer}>
                <PrefixedTextField
                  label="Mobile Number"
                  prefix="(+960)"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={7}
                  rightIcon={
                    // Show verify icon only if phone matches original (verified)
                    phone === originalPhone ? (
                      <Icon.verify color={theme.colors.system.body.success} />
                    ) : undefined
                  }
                />
                <Text
                  style={[
                    theme.typography.body.xs.regular,
                    { color: phoneChanged ? theme.colors.system.body.warning || "#f59e0b" : theme.colors.system.body.disabled, marginTop: 4 },
                  ]}
                >
                  {phoneChanged
                    ? "Phone number changed - verification required on save"
                    : "Changing the mobile number will require verification"}
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              {isFormValid && (
                <Button
                  label={isLoading ? "Saving..." : "Save"}
                  variant="filled"
                  onPress={!isLoading ? handleSave : undefined}
                />
              )}
              <Button
                label="Cancel"
                variant="outline"
                onPress={() => router.push("/account")}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  scrollContainer: { flexGrow: 1, gap: 24 },
  header: { flexDirection: "column", gap: 8 },
  body: { flex: 1, flexDirection: "column", gap: 16 },
  backBtn: { width: 32, height: 32, justifyContent: "center", marginBottom: 8 },
  mobileContainer: { flexDirection: "column", gap: 4 },
  footer: {
    marginTop: "auto",
    flexDirection: "column",
    gap: 12,
  },
});
