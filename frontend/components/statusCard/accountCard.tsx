import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import BaseCard from "./base";
import Button from "../button";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const AccountCard: React.FC = () => {
  const {theme} = useTheme();
  const router = useRouter();

  const [fullName, setFullName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        const storedName = await AsyncStorage.getItem("fullName");
        const storedEmail = await AsyncStorage.getItem("email");
        const storedPhone = await AsyncStorage.getItem("phone");

        setFullName(storedName);
        setEmail(storedEmail);
        setPhone(storedPhone);
      };

      loadData();
    }, [])
  );
  return (
    <BaseCard
      colors={theme.colors.card.background.primary}
      customStyle={styles.wrapper}
    >
      <View style={styles.container}>
        <View style={styles.body}>
          <Text
            style={[
              {
                ...theme.typography.heading.xs,
                color: theme.colors.card.label.default,
                flexShrink: 1, // allow shrinking
                flexWrap: "wrap", // allow wrapping
                maxWidth: 200, // optional: control width
              },
            ]}
          >
            {fullName ?? "Loading..."}
          </Text>

          <View style={styles.textWrapper}>
            {/* PHONE */}
            <Text style={[{ color: theme.colors.card.label.secondary }]}>
              +960 {phone}
            </Text>

            {/* EMAIL */}
            <Text style={[{ color: theme.colors.card.label.secondary }]}>
              {email ?? null}
            </Text>
          </View>
        </View>

        <Button
          variant="tonal"
          label="Edit"
          onPress={() => router.push("/profile")}
        />

        <View style={styles.imageWrapper}>
          <Image
            source={require("@/assets/images/activity-1.png")}
            resizeMode="contain"
          />
        </View>
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  wrapper: { height: "auto" },
  container: {
    alignItems: "flex-start",
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: "space-between",
  },
  body: {
    flexDirection: "column",
    alignContent: "center",

    gap: 12,
  },
  textWrapper: {
    flexDirection: "column",
    gap: 8,
  },
  imageWrapper: {
    zIndex: -10,
    position: "absolute",
    top: -60,
    right: -100,
    opacity: 0.9,
  },
});
export default AccountCard;
