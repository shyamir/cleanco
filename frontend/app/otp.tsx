import React, { useRef, useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  useColorScheme,
  TextInput,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Alert,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CORRECT_OTP } from "@/constants/otp";
import { useTheme } from "@/theme/ThemeProvider";
import GradientText from "@/components/gradientText";
import Button from "@/components/button";
import { useRouter } from "expo-router";
import { getPhoneNumber } from "@/utils/otpStore";
import OtpInputs from "@/components/otpInputs";

type OtpInputsProps = {
  length?: number;
  onChange: (code: string) => void;
};

export default function Otp() {
const {theme} = useTheme();
  const router = useRouter();
  const scheme = useColorScheme();
  // const phone = getPhoneNumber();
  const [otp, setOtp] = useState("");

  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    const loadPhone = async () => {
      const storedPhone = await getPhoneNumber();
      setPhone(storedPhone);
    };

    loadPhone();
  }, []);
  
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
            scheme === "dark"
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
          <View style={{ opacity: otp.length === 4 ? 1 : 0.5 }}>
            <Button
              label="Verify"
              variant="filled"
              onPress={
                otp.length === 4
                  ? async () => {
                      if (otp === CORRECT_OTP) {
                        const verifiedPhone = await getPhoneNumber(); // user's phone
                        await AsyncStorage.setItem("phone", verifiedPhone); // save verified phone
                        router.push("/profile-setup"); // navigate after verification
                      } else {
                        Alert.alert(
                          "Invalid OTP",
                          "The OTP you entered is incorrect."
                        );
                      }
                    }
                  : undefined
              }
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
