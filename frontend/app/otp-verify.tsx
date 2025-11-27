import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  useColorScheme,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/theme/ThemeProvider";
import GradientText from "@/components/gradientText";
import Button from "@/components/button";
import { CORRECT_OTP } from "@/constants/otp";
import OtpInputs from "@/components/otpInputs";
import { Icon } from "@/constants/icon";

export default function OtpVerification() {
const {theme} = useTheme();
  const scheme = useColorScheme();
  const router = useRouter();
  const { mobile } = useLocalSearchParams();
  const [otp, setOtp] = useState("");

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.system.background.default },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push("/verification")}
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
            OTP Verification
          </Text>
        </View>

        <View style={styles.body}>
          <Text
            style={[
              theme.typography.body.sm.regular,
              { color: theme.colors.system.body.default },
            ]}
          >
            We have sent you an OTP on +960 {mobile}
          </Text>

          <OtpInputs length={4} onChange={setOtp} />
        </View>

        <View style={{ opacity: otp.length === 4 ? 1 : 0.5 }}>
          <Button
            label="Verify"
            variant="filled"
            onPress={
              otp.length === 4
                ? async () => {
                    if (otp === CORRECT_OTP) {
                      await AsyncStorage.setItem("phone", String(mobile));
                      router.push("/profile");
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  image: { width: "40%" },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    marginBottom: 8,
  },
  header: {
    flexDirection: "column",
    gap: 8,
  },
  body: {
    flexGrow: 1,
    flexDirection: "column",
    gap: 32,
  },
});
