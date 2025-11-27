import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter, useLocalSearchParams } from "expo-router";
import Button from "@/components/button";
import { Icon } from "@/constants/icon";
import TextField from "@/components/inputs/textfield";
import PrefixedTextField from "@/components/inputs/predefinedTextField";

export default function Profile() {
  const {theme} = useTheme();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const fn = await AsyncStorage.getItem("fullName");
      const em = await AsyncStorage.getItem("email");
      const ph = await AsyncStorage.getItem("phone"); // read verified phone

      if (fn) setFullName(fn);
      if (em) setEmail(em);
      if (ph) setPhone(ph);
    };
    loadData();
  }, []);

  const handleOnPress = async () => {
    await AsyncStorage.setItem("tempPhone", phone);
    router.push("/verification");
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem("fullName", fullName);
      await AsyncStorage.setItem("email", email);
      await AsyncStorage.setItem("phone", phone);

      router.push("/account"); // go back to account screen
    } catch (e) {
      console.log("Save error:", e);
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
              <TextField
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
              />

              <TextField
                label="Email"
                value={email}
                onChangeText={(text) => {
                  // convert to lowercase first
                  let cleaned = text.toLowerCase();

                  // allow only letters, @ and .
                  cleaned = cleaned.replace(/[^a-z@.]/g, "");

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

              <View style={styles.mobileContainer}>
                <PrefixedTextField
                  label="Mobile Number"
                  prefix="(+960)"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={7}
                  rightIcon={
                    <Icon.verify color={theme.colors.system.body.success} />
                  }
                  onPress={handleOnPress}
                />
                <Text
                  style={[
                    theme.typography.body.xs.regular,
                    { color: theme.colors.system.body.disabled, marginTop: 4 },
                  ]}
                >
                  Changing the mobile number will require verification
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <Button label="Save" variant="filled" onPress={handleSave} />
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
