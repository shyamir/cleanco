import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";
import { Icon } from "@/constants/icon";
import SubscriptionCard from "@/components/card/subscriptionCard";
import { MOCK_BOOKINGS } from "@/constants/mockBookings";
import SearchBar from "@/components/searchBar";
import { useAddress } from "@/context/address-context";
import GoogleMap from "@/components/googleMap";

export default function AddWork() {
  const { theme } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { selected, setSelected } = useAddress();

  const renderNewItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        setSelected({
          label: item.main_text,
          address: item.secondary_text,
        });
        router.push({
          pathname: "/save-address",
          params: {
            source: "add-work", // tells SaveAddress to hide label group
            returnTo: "account", // tells SaveAddress where to go after saving
          },
        });
      }}
    >
      <Text
        style={[
          theme.typography.body.md.regular,
          { color: theme.colors.system.body.default },
        ]}
      >
        {item.main_text}
      </Text>
      <Text
        style={[
          theme.typography.body.md.regular,
          { color: theme.colors.system.body.disabled },
        ]}
      >
        {item.secondary_text}
      </Text>
    </TouchableOpacity>
  );

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
              Add Work
            </Text>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <GoogleMap />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  scrollContainer: { flexGrow: 1, gap: 12 },
  backBtn: { width: 32, height: 32, justifyContent: "center", marginBottom: 8 },
  header: { flexDirection: "column", gap: 8 },
  setLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  suggestionItem: { paddingVertical: 8 },
});
