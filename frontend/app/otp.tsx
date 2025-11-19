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
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Alert,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

/* --- Constants ---*/
import { CORRECT_OTP } from "@/constants/otp";

/* --- Theme ---*/
import { useTheme } from "@/theme/useTheme";

/* --- Hook ---*/
import GradientText from "@/components/gradientText";
import PrefixedTextField from "@/components/inputs/predefinedTextField";
import Button from "@/components/button";
import { useRouter } from "expo-router";

import { getPhoneNumber } from "@/utils/otpStore";

type OtpInputsProps = {
  length?: number;
  onChange: (code: string) => void;
};

const OtpInputs: React.FC<OtpInputsProps> = ({ length = 4, onChange }) => {
  const theme = useTheme();
  const [values, setValues] = useState(Array(length).fill(""));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputsRef = Array.from({ length }, () => useRef<TextInput>(null));

  // Focus first input on mount
  React.useEffect(() => {
    inputsRef[0].current?.focus();
  }, []);

  const handleChange = (text: string, index: number) => {
    const newValue = text.replace(/[^0-9]/g, "").slice(0, 1);
    const updatedValues = [...values];
    updatedValues[index] = newValue;
    setValues(updatedValues);
    onChange(updatedValues.join(""));

    // Move focus to next input if there is one
    if (newValue && index < length - 1) {
      setFocusedIndex(index + 1);
      setTimeout(() => {
        inputsRef[index + 1].current?.focus();
      }, 50); // small delay ensures cursor moves
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace") {
      if (values[index] === "" && index > 0) {
        inputsRef[index - 1].current?.focus();
        setFocusedIndex(index - 1);
      } else {
        const updatedValues = [...values];
        updatedValues[index] = "";
        setValues(updatedValues);
        onChange(updatedValues.join(""));
      }
    }
  };

  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {values.map((v, i) => (
        <TextInput
          key={i}
          ref={inputsRef[i]}
          value={v}
          onChangeText={(t) => handleChange(t, i)}
          keyboardType="number-pad"
          maxLength={1}
          autoFocus={i === 0}
          onKeyPress={(e) => handleKeyPress(e, i)}
          onFocus={() => setFocusedIndex(i)}
          editable={i === 0 || values[i - 1] !== ""}
          style={{
            width: 48,
            height: 48,
            borderWidth: 1,
            borderRadius: 48,
            textAlign: "center",
            fontFamily: theme.typography.body.md.regular.fontFamily,
            fontSize: theme.typography.body.md.regular.fontSize,
            color: theme.colors.system.body.default,
            borderColor:
              focusedIndex === i
                ? theme.colors.input.border.active // blue active border on focus
                : theme.colors.input.border.default, // default border
            backgroundColor: theme.colors.input.background.default,
          }}
        />
      ))}
    </View>
  );
};

// --- Main OTP Screen ---
export default function Otp() {
  const theme = useTheme();
  const router = useRouter();
  const scheme = useColorScheme();
  const phone = getPhoneNumber();
  const [otp, setOtp] = useState("");

  // Button is enabled only if all 4 digits are filled
  const isButtonEnabled = otp.length === 4;

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

          {/* --- OTP Inputs --- */}
          <OtpInputs length={4} onChange={(code) => setOtp(code)} />
        </View>

        <View style={styles.footer}>
          <View style={{ opacity: otp.length === 4 ? 1 : 0.5 }}>
            <Button
              label="Verify"
              variant="filled"
              onPress={
                otp.length === 4
                  ? () => {
                      if (otp === CORRECT_OTP) {
                        router.push("/profile-setup"); // navigate if OTP matches
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

          <View style={styles.text}>
            <Text
              style={[
                theme.typography.body.xs.regular,
                { color: theme.colors.system.body.secondary, marginTop: 8 },
              ]}
            >
              Didn't receive?
            </Text>
            <Text
              style={[
                theme.typography.body.xs.medium,
                { color: theme.colors.system.body.active, marginTop: 8 },
              ]}
            >
              Resend OTP
            </Text>
          </View>
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
  text: {
    flexDirection: "row",
    gap: 8,
  },
  body: {
    flexDirection: "column",
    gap: 16,
  },
  footer: {
    flexDirection: "column",
    gap: 16,
  },
});
