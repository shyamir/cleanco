// export default SetLocationOnMap;
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAddress } from "@/context/address-context";
import Geocoder from "react-native-geocoding";
import Button from "@/components/button";
import TextField from "@/components/inputs/textfield";
import lightMapStyle from "@/constants/lightMap.json";
import darkMapStyle from "@/constants/darkMap.json";
import { Icon } from "@/constants/icon";

const GOOGLE_MAPS_API_KEY = "AIzaSyCExFwNPZx7589yT31YLEFOidnQsDgXkvg";
Geocoder.init(GOOGLE_MAPS_API_KEY);

const SetLocationOnMap = () => {
  const { theme, mode } = useTheme();
  const router = useRouter();
  const { selected, setSelected } = useAddress();
  const isDark = mode === "dark";

  const [region, setRegion] = useState<Region>({
    latitude: selected?.latitude || 4.1755,
    longitude: selected?.longitude || 73.5093,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [address, setAddress] = useState(selected?.address || "");
  const [loadingAddress, setLoadingAddress] = useState(false);

  useEffect(() => {
    console.log("🟡 Region changed:", region);

    const fetchAddress = async () => {
      setLoadingAddress(true);
      try {
        //   console.log("📍 Fetching address...");
        const json = await Geocoder.from(region.latitude, region.longitude);

        //   console.log("📌 Geocode response:", JSON.stringify(json, null, 2));

        if (json.results.length > 0) {
          const formatted = json.results[0].formatted_address;

          const components = json.results[0].address_components;
          const route = components.find((c) =>
            c.types.includes("route")
          )?.long_name;
          const locality = components.find((c) =>
            c.types.includes("locality")
          )?.long_name;

          const mainText = [route, locality].filter(Boolean).join(", ");
          const displayAddress = mainText || formatted;

          // console.log("✔ Final address used:", displayAddress);

          setAddress(displayAddress);
        } else {
          // console.log("❌ No address found");
          setAddress("Unknown location");
        }
      } catch (err) {
        console.log("🚨 Reverse geocoding error:", err);
      } finally {
        setLoadingAddress(false);
        console.log("🏁 Loading complete");
      }
    };

    fetchAddress();
  }, [region]);

  const { source, returnTo } = useLocalSearchParams<{
    source?: string;
    returnTo?: string;
  }>();
  const handleConfirm = () => {
    // Save the selected location
    setSelected({
      ...selected,
      latitude: region.latitude,
      longitude: region.longitude,
      address,
      label: selected.label || "Home", // default label if empty
    });

    // Navigate based on source / returnTo
    if (source === "address-search") {
      if (returnTo === "home-cleaning") {
        router.replace("/home-cleaning");
      } else if (returnTo === "office-cleaning") {
        router.replace("/office-cleaning");
      } else {
        router.back(); // fallback
      }
    } else if (source === "add-home" || source === "add-work") {
      router.replace("/account");
    } else {
      router.back(); // fallback
    }
  };
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.wrapper}>
        {/* Map covering entire screen */}
        <MapView
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onRegionChangeComplete={setRegion}
          customMapStyle={isDark ? darkMapStyle : lightMapStyle}
        />

        {/* Center fixed pin */}
        <View style={styles.pinFixed}>
          <Text style={{ fontSize: 32 }}>📍</Text>
        </View>

        {/* Header overlay */}
        <View
          style={[
            styles.header,
            { paddingTop: Platform.OS === "ios" ? 48 : 24 },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: theme.colors.system.background.secondary,
              padding: 12,
              borderRadius: 24,
            }}
          >
            <Icon.back color={theme.colors.button.label.secondary} />
          </TouchableOpacity>
        </View>

        {/* Bottom sheet overlay */}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[
            styles.bottomSheet,
            { backgroundColor: theme.colors.system.background.default },
          ]}
        >
          <View style={styles.sheetContent}>
            <TextField
              key={address}
              value={address}
              onChangeText={setAddress}
              placeholder="Selected location"
            />

            <Button
              label="Confirm Location"
              onPress={handleConfirm}
              variant="filled"
              style={{ marginBottom: 24 }}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  pinFixed: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -16,
    marginTop: -32,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 30, // 👈 avoid clipping
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 5,
    zIndex: 20, // 👈 make sure it's above the map
  },

  sheetContent: {
    gap: 12, // gap between TextField and button
  },
});

export default SetLocationOnMap;
