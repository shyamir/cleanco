import { useTheme } from "@/theme/ThemeProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Button from "../button";
import BaseCard from "./base";

const AccountCard: React.FC = () => {
  const {theme} = useTheme();
  const router = useRouter();

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        const userStr = await AsyncStorage.getItem("user");
        const storedPhone = await AsyncStorage.getItem("phone");

        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user && typeof user === 'object') {
              setFirstName(user.firstName || "");
              setLastName(user.lastName || "");
              setEmail(user.email);
            }
          } catch {
            console.warn('Failed to parse user cache');
          }
        }
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
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              {
                ...theme.typography.heading.xs,
                color: theme.colors.card.label.default,
                maxWidth: 250,
              },
            ]}
          >
            {firstName || "Loading..."}
          </Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              {
                ...theme.typography.heading.xs,
                color: theme.colors.card.label.default,
                maxWidth: 280,
                height: lastName ? undefined : 0,
                overflow: "hidden",
              },
            ]}
          >
            {lastName}
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

        {/* Image rendered last so it appears on top */}
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
  wrapper: { height: "auto", overflow: "hidden" },
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
    position: "absolute",
    top: -60,
    right: -100,
    opacity: 0.9,
    pointerEvents: "none",
  },
});
export default AccountCard;
