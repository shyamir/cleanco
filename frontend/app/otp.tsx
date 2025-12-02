import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Alert,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import GradientText from "@/components/gradientText";
import Button from "@/components/button";
import { useRouter } from "expo-router";
import { getPhoneNumber } from "@/utils/otpStore";
import OtpInputs from "@/components/otpInputs";
import { authService } from "@/services/auth";

export default function Otp() {
  const { theme, mode } = useTheme();
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPhone = async () => {
      const storedPhone = await getPhoneNumber();
      setPhone(storedPhone);
    };
    loadPhone();
  }, []);

  const handleVerifyOtp = async () => {
    if (otp.length !== 4 || !phone) return;

    setIsLoading(true);
    try {
      const formattedPhone = `+960${phone}`;
      const response = await authService.verifyOtp(formattedPhone, otp);

      // Store tokens and user data
      await authService.storeTokens(response.accessToken, response.refreshToken);
      await authService.storeUser(response.user);

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
            We have sent you an OTP on +960 {phone}
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
  header: { flexDirection: "column", alignItems: "flex-start" },
  image: { width: "40%" },
  text: { flexDirection: "row", gap: 8 },
  body: { flexDirection: "column", gap: 16 },
  footer: { flexDirection: "column", gap: 16 },
});
