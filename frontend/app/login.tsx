import React, { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  useColorScheme,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

/* --- Theme ---*/
import { useTheme } from "@/theme/ThemeProvider";

/* --- Components ---*/
import GradientText from "@/components/gradientText";
import PrefixedTextField from "@/components/inputs/predefinedTextField";
import Button from "@/components/button";
import { useRouter } from "expo-router";
import { setPhoneNumber } from "@/utils/otpStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "@/services/auth";

export default function Login() {
const {theme, mode} = useTheme();
  const router = useRouter();

  const scheme = useColorScheme(); // detect light/dark

  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false); // track if user interacted
  const [isLoading, setIsLoading] = useState(false);
  const phoneRef = useRef<TextInput>(null); // ref to autoFocus

  const isPhoneValid = () => {
    const digitsOnly = phone.replace(/[^0-9]/g, "");
    const maldivianPhoneRegex = /^[79]\d{6}$/; // Must start with 7 or 9, followed by 6 digits
    return maldivianPhoneRegex.test(digitsOnly);
  };

  const hasInvalidPrefix = () => {
    const digitsOnly = phone.replace(/[^0-9]/g, "");
    return digitsOnly.length > 0 && !['7', '9'].includes(digitsOnly[0]);
  };

  const handleSendOtp = async () => {
    if (!isPhoneValid()) return;

    setIsLoading(true);
    try {
      const formattedPhone = `+960${phone}`;
      await authService.sendOtp(formattedPhone);

      // Store phone for OTP screen
      setPhoneNumber(phone);
      await AsyncStorage.setItem("phone", phone);

      router.push("/otp");
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to send OTP. Please try again.";
      Alert.alert("Error", message);
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
            text="Hello"
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
            there!
          </Text>
        </View>

        <View style={styles.body}>
          <PrefixedTextField
            ref={phoneRef}
            autoFocus
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setTouched(true);
            }}
            placeholder="9999999"
            maxLength={7}
            keyboardType="numeric"
            showCharCount
          />

          {hasInvalidPrefix() ? (
            <Text
              style={[
                theme.typography.body.xs.regular,
                { color: "#E53935", marginTop: 8 },
              ]}
            >
              Phone number must start with 7 or 9
            </Text>
          ) : (
            <Text
              style={[
                theme.typography.body.xs.regular,
                { color: theme.colors.system.body.secondary, marginTop: 8 },
              ]}
            >
              A verification code will be sent to this number
            </Text>
          )}
        </View>
        <View style={styles.footer}>
          <View style={{ opacity: !isPhoneValid() || isLoading ? 0.5 : 1 }}>
            <Button
              label={isLoading ? "Sending..." : "Continue"}
              variant="filled"
              onPress={isPhoneValid() && !isLoading ? handleSendOtp : undefined}
            />
          </View>
          <Text
            style={[
              theme.typography.body.xs.regular,
              { color: theme.colors.system.body.secondary, marginTop: 8 },
            ]}
          >
            By proceeding, you consent to receiving calls, WhatsApp or SMS/RCS
            messages, including by automated means, from Cleanco and its
            affiliates to the number provided.
          </Text>
        </View>
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
  body: {},
  footer: {
    flexDirection: "column",
    gap: 16,
  },
});
