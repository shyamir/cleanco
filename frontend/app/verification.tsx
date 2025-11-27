import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  useColorScheme,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import Button from "@/components/button";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Icon } from "@/constants/icon";
import PrefixedTextField from "@/components/inputs/predefinedTextField";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Verification() {
  const {theme} = useTheme();
  const scheme = useColorScheme();
  const router = useRouter();
  const [mobileNumber, setMobileNumber] = useState("");

  useEffect(() => {
    const loadTempPhone = async () => {
      const savedPhone = await AsyncStorage.getItem("tempPhone");
      if (savedPhone) {
        setMobileNumber(savedPhone);
      }
    };
    loadTempPhone();
  }, []);

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
            onPress={() => router.push("/profile")}
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
            Mobile Number
          </Text>
        </View>

        <View style={styles.body}>
          <Text
            style={[
              theme.typography.body.md.regular,
              { color: theme.colors.system.body.default },
            ]}
          >
            You'll use this number to get notifications, sign in and recover
            your account.
          </Text>

          <View>
            <PrefixedTextField
              autoFocus
              value={mobileNumber}
              onChangeText={setMobileNumber}
              maxLength={7}
              keyboardType="numeric"
              showCharCount
              label="Mobile Number"
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
        </View>

        <Button
          label="Update"
          variant="filled"
          onPress={
            mobileNumber.length >= 7
              ? () => router.push(`/otp-verify?mobile=${mobileNumber}`)
              : undefined
          }
          style={{ opacity: mobileNumber.length >= 7 ? 1 : 0.5 }}
        />
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
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    marginBottom: 8,
  },
  body: {
    flexGrow: 1,
    flexDirection: "column",
    gap: 32,
  },
  header: {
    flexDirection: "column",
    gap: 8,
  },
});
