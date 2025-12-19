import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import GradientText from "@/components/gradientText";
import Button from "@/components/button";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getPhoneNumber } from "@/utils/otpStore";
import OtpInputs from "@/components/otpInputs";
import { authService } from "@/services/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Icon } from "@/constants/icon";
import { useActivity } from "@/context/activity-context";
import { useHomeData } from "@/context/home-data-context";
import { useAddress } from "@/context/address-context";

export default function Otp() {
  const { theme, mode: themeMode } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; newPhone?: string }>();
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { refreshBookings } = useActivity();
  const { refreshHomeData } = useHomeData();
  const { loadAddresses } = useAddress();

  const isPhoneChangeMode = params.mode === "phone-change";

  useEffect(() => {
    const loadPhone = async () => {
      const storedPhone = await getPhoneNumber();
      setPhone(storedPhone);
    };
    loadPhone();
  }, []);

  const handlePhoneChangeVerify = async () => {
    if (otp.length !== 4 || !phone) return;

    setIsLoading(true);
    try {
      const formattedPhone = `+960${phone}`;

      // Update phone number with OTP verification
      await authService.updatePhone(formattedPhone, otp);

      // Also update profile (name/email) from pending data
      const pendingProfileStr = await AsyncStorage.getItem("pendingProfile");
      if (pendingProfileStr) {
        const pendingProfile = JSON.parse(pendingProfileStr);
        await authService.updateProfile({
          firstName: pendingProfile.firstName,
          lastName: pendingProfile.lastName || null,
          email: pendingProfile.email || null,
        });
        await AsyncStorage.removeItem("pendingProfile");
      }

      // Update local storage with new phone
      await AsyncStorage.setItem("phone", phone);

      Alert.alert("Success", "Phone number updated successfully", [
        { text: "OK", onPress: () => router.replace("/account") },
      ]);
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Phone already in use by another user
        Alert.alert(
          "Phone Number Unavailable",
          "This phone number is already registered to another account.",
          [{ text: "OK", onPress: () => router.replace("/profile") }]
        );
      } else if (error.response?.status === 401) {
        Alert.alert("Invalid OTP", "The OTP code is invalid or expired. Please try again.");
      } else {
        const message = error.response?.data?.message || "Failed to update phone number. Please try again.";
        Alert.alert("Error", message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginVerify = async () => {
    if (otp.length !== 4 || !phone) return;

    setIsLoading(true);
    try {
      const formattedPhone = `+960${phone}`;
      const response = await authService.verifyOtp(formattedPhone, otp);

      // Store tokens and user data
      await authService.storeTokens(response.accessToken, response.refreshToken);
      await authService.storeUser(response.user);

      // Refresh bookings, home data, and addresses after successful login
      refreshBookings();
      refreshHomeData();
      await loadAddresses();

      // Navigate to profile-setup if user is new OR hasn't completed profile
      if (response.isNewUser || !response.user.firstName) {
        router.push("/profile-setup");
      } else {
        router.push("/home");
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Invalid OTP. Please try again.";
      Alert.alert("Verification Failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = isPhoneChangeMode ? handlePhoneChangeVerify : handleLoginVerify;

  const handleBack = async () => {
    // Clean up pending profile data
    await AsyncStorage.removeItem("pendingProfile");
    router.replace("/profile");
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.system.background.default },
        ]}
      >
        {isPhoneChangeMode && (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Icon.back color={theme.colors.system.body.default} />
          </TouchableOpacity>
        )}

        <Image
          source={
            themeMode === "dark"
              ? require("@/assets/images/dark-logo.png")
              : require("@/assets/images/light-logo.png")
          }
          style={styles.image}
          resizeMode="contain"
        />

        <View style={styles.header}>
          <GradientText
            variant={theme.typography.heading.md}
            text="Verify"
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
            Code
          </Text>
        </View>

        <View style={styles.body}>
          <Text
            style={[
              theme.typography.body.sm.regular,
              { color: theme.colors.system.body.default, marginTop: 8 },
            ]}
          >
            {`We have sent you an OTP on +960 ${phone}`}
          </Text>

          <OtpInputs length={4} onChange={(code) => setOtp(code)} />
        </View>

        <View style={styles.footer}>
          <View style={{ opacity: otp.length === 4 && !isLoading ? 1 : 0.5 }}>
            <Button
              label={isLoading ? "Verifying..." : "Verify"}
              variant="filled"
              onPress={otp.length === 4 && !isLoading ? handleVerifyOtp : undefined}
            />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 48, flexDirection: "column", gap: 48 },
  backBtn: { width: 32, height: 32, justifyContent: "center", marginBottom: -24 },
  header: { flexDirection: "column", alignItems: "flex-start" },
  image: { width: "40%" },
  text: { flexDirection: "row", gap: 8 },
  body: { flexDirection: "column", gap: 16 },
  footer: { flexDirection: "column", gap: 16 },
});
