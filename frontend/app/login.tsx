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
import { useTheme } from "@/theme/useTheme";

/* --- Hook ---*/
import GradientText from "@/components/gradientText";
import PrefixedTextField from "@/components/inputs/predefinedTextField";
import Button from "@/components/button";
import { useRouter } from "expo-router";
import { setPhoneNumber } from "@/utils/otpStore";

export default function Login() {
  const theme = useTheme();
  const router = useRouter();

  const scheme = useColorScheme(); // detect light/dark

  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false); // track if user interacted
  const phoneRef = useRef<TextInput>(null); // ref to autoFocus

  const isPhoneValid = () => {
    const digitsOnly = phone.replace(/[^0-9]/g, "");
    const maldivianPhoneRegex = /^\d{7}$/;
    return maldivianPhoneRegex.test(digitsOnly);
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

          <Text
            style={[
              theme.typography.body.xs.regular,
              { color: theme.colors.system.body.secondary, marginTop: 8 },
            ]}
          >
            A verification code will be sent to this number
          </Text>
        </View>
        <View style={styles.footer}>
          <View style={{ opacity: !isPhoneValid() ? 0.5 : 1 }}>
            <Button
              label="Continue"
              variant="filled"
              onPress={
                isPhoneValid() ? () => {
                  setPhoneNumber(phone); // save phone before navigating
                  router.push("/otp");
                } : undefined
              }
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
