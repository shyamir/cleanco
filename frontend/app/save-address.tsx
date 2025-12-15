import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/constants/icon";
import { useTheme } from "@/theme/ThemeProvider";
import { useLocalSearchParams, useRouter } from "expo-router";
import Button from "@/components/button";
import TextField from "@/components/inputs/textfield";
import BottomSheetDropdown from "@/components/bottomSheet/dropdown";
import { useAddress } from "@/context/address-context";
import { useBooking } from "@/context/booking-context";
import ToggleGroup from "@/components/toggleButton/toggleGroup";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import Geocoder from "react-native-geocoding";
import axios from "axios";
import * as Location from "expo-location";
import lightMapStyle from "@/constants/lightMap.json";
import darkMapStyle from "@/constants/darkMap.json";
import { addressApi, CreateAddressRequest, Zone } from "@/services/addressService";

const GOOGLE_MAPS_API_KEY = "AIzaSyCExFwNPZx7589yT31YLEFOidnQsDgXkvg";

const SaveAddress = () => {
  const { theme, mode } = useTheme();
  const router = useRouter();
  const { selected, setSelected } = useAddress();
  const { setAddressId } = useBooking();

  // --- State ---
  const [addressLine, setAddressLine] = useState(""); // House/Apt number, floor, etc.
  const [street, setStreet] = useState(""); // Street/Magu
  const [landmark, setLandmark] = useState(""); // Landmark/Goalhi
  const [selectedZone, setSelectedZone] = useState(""); // Zone from database
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(true);
  const [label, setLabel] = useState("Home");
  const [customLabel, setCustomLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Current location info displayed below map (updates when pin moves)
  const [currentMapLabel, setCurrentMapLabel] = useState(selected?.label || "");
  const [currentMapAddress, setCurrentMapAddress] = useState(selected?.address || "");

  const mapRef = useRef<MapView>(null);

  const { source, returnTo, editId, label: labelParam } = useLocalSearchParams<{
    source?: string;
    returnTo?: string;
    editId?: string;
    label?: string;
  }>();

  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  Geocoder.init("AIzaSyCExFwNPZx7589yT31YLEFOidnQsDgXkvg");
  const isDark = mode === "dark";

  // Load zones from backend
  useEffect(() => {
    const loadZones = async () => {
      try {
        const fetchedZones = await addressApi.getZones();
        setZones(fetchedZones);
        if (fetchedZones.length > 0 && !editId) {
          setSelectedZone(fetchedZones[0].name);
        }
      } catch (error) {
        console.error("Failed to load zones:", error);
      } finally {
        setIsLoadingZones(false);
      }
    };
    loadZones();
  }, [editId]);

  // Load existing address for editing (wait for zones to be loaded first)
  useEffect(() => {
    const loadExistingAddress = async () => {
      if (!editId) {
        // Set label from param if creating new address
        if (labelParam) {
          setLabel(labelParam);
        }
        return;
      }

      // Wait for zones to be loaded before loading address
      if (zones.length === 0) {
        return;
      }

      setIsLoadingAddress(true);
      try {
        const address = await addressApi.getAddress(editId);
        // Pre-populate form fields
        setAddressLine(address.address || "");
        setStreet(address.street || "");
        setLandmark(address.landmark || "");
        if (address.zone?.name) {
          setSelectedZone(address.zone.name);
        } else if (address.zoneId) {
          // Fallback: find zone by ID if name not included
          const zone = zones.find(z => z.id === address.zoneId);
          if (zone) {
            setSelectedZone(zone.name);
          }
        }
        if (address.label) {
          if (["Home", "Work"].includes(address.label)) {
            setLabel(address.label);
          } else {
            setLabel("Other");
            setCustomLabel(address.label);
          }
        }
        // Set coordinates if available
        if (address.latitude && address.longitude) {
          setCoords({ latitude: address.latitude, longitude: address.longitude });
          setCurrentMapLabel(address.label || "Address");
          const displayAddress = [address.address, address.street, address.landmark]
            .filter(Boolean)
            .join(", ");
          setCurrentMapAddress(displayAddress);
        }
      } catch (error) {
        console.error("Failed to load address:", error);
        Alert.alert("Error", "Failed to load address details");
      } finally {
        setIsLoadingAddress(false);
      }
    };

    loadExistingAddress();
  }, [editId, labelParam, zones]);

  // Check if all required fields are filled
  const isFormValid = Boolean(
    addressLine.trim() &&
    street.trim() &&
    landmark.trim() &&
    selectedZone
  );

  // Get zone ID from selected zone name
  const getSelectedZoneId = (): string | null => {
    const zone = zones.find(z => z.name === selectedZone);
    return zone?.id || null;
  };

  // Navigate back based on source
  const navigateBack = () => {
    if (source === "account") {
      router.replace("/account");
    } else if (source === "saved-addresses") {
      router.replace("/saved-addresses");
    } else if (source === "address-search" || source === "set-location") {
      if (returnTo === "home-cleaning") {
        router.replace("/home-cleaning");
      } else if (returnTo === "office-cleaning") {
        router.replace("/office-cleaning");
      } else if (returnTo === "saved-addresses") {
        router.replace("/saved-addresses");
      } else if (returnTo === "account") {
        router.replace("/account");
      } else {
        router.back();
      }
    } else if (source === "add-home" || source === "add-work") {
      router.replace("/account");
    } else {
      router.back();
    }
  };

  // Save address to backend and update context
  const saveAddressToBackend = async (withLabel: boolean) => {
    const zoneId = getSelectedZoneId();
    if (!zoneId) {
      Alert.alert("Error", "Please select a valid zone.");
      return;
    }

    setIsSaving(true);

    try {
      const addressLabel = withLabel
        ? label === "Other"
          ? customLabel || "Other"
          : label
        : undefined;

      const request: CreateAddressRequest = {
        label: addressLabel,
        address: addressLine,
        street: street,
        landmark: landmark,
        zoneId: zoneId,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      };

      // Update existing address or create new one
      const savedAddress = editId
        ? await addressApi.updateAddress(editId, request)
        : await addressApi.createAddress(request);

      // Build display address from separate fields
      const displayAddress = [savedAddress.address, savedAddress.street, savedAddress.landmark]
        .filter(Boolean)
        .join(", ");

      // Only update selected address in booking context when coming from booking flow
      // Don't update when managing addresses from account page
      const isFromBookingFlow = returnTo === "home-cleaning" || returnTo === "office-cleaning";
      if (isFromBookingFlow) {
        setSelected({
          id: savedAddress.id,
          label: savedAddress.label || "Address",
          address: displayAddress,
          latitude: savedAddress.latitude,
          longitude: savedAddress.longitude,
        });
        setAddressId(savedAddress.id);
      }

      navigateBack();
    } catch (error: any) {
      console.error("Failed to save address:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to save address. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle "Save Address" button
  const handleSaveAddress = () => {
    saveAddressToBackend(true);
  };

  // Reverse geocode coordinates to get address
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const json = await Geocoder.from(latitude, longitude);
      if (json.results && json.results.length > 0) {
        const result = json.results[0];
        const components = result.address_components;

        // Extract main location name (route, point of interest, or locality)
        const localityComponent = components.find((c: any) =>
          c.types.includes("locality")
        );
        const routeComponent = components.find((c: any) =>
          c.types.includes("route")
        );
        const poiComponent = components.find((c: any) =>
          c.types.includes("point_of_interest") || c.types.includes("establishment")
        );
        const sublocalityComponent = components.find((c: any) =>
          c.types.includes("sublocality_level_1") || c.types.includes("neighborhood")
        );

        // Build main label from available components
        const mainLabel = poiComponent?.long_name ||
          routeComponent?.long_name ||
          sublocalityComponent?.long_name ||
          localityComponent?.long_name ||
          "Selected Location";

        // Update current map label and address display
        setCurrentMapLabel(mainLabel);
        setCurrentMapAddress(result.formatted_address);
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  // Get place details from Google Place ID (more reliable than geocoding address string)
  const getPlaceDetails = async (placeId: string) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            key: GOOGLE_MAPS_API_KEY,
            fields: "geometry,address_components,formatted_address",
          },
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("Place Details API error:", error);
      return null;
    }
  };

  // Fallback geocoding using address string
  const fallbackGeocode = async () => {
    if (!selected.address) {
      setCoords({ latitude: 4.1755, longitude: 73.5093 });
      await reverseGeocode(4.1755, 73.5093);
      return;
    }

    try {
      const json = await Geocoder.from(selected.address);
      if (json.results && json.results.length > 0) {
        const result = json.results[0];
        const location = result.geometry.location;
        setCoords({ latitude: location.lat, longitude: location.lng });
      } else {
        // No results found, use default location
        setCoords({ latitude: 4.1755, longitude: 73.5093 });
        await reverseGeocode(4.1755, 73.5093);
      }
    } catch (error: any) {
      // Silently handle geocoding failures - just use default location
      console.log("Using default location (geocoding unavailable)");
      setCoords({ latitude: 4.1755, longitude: 73.5093 });
      await reverseGeocode(4.1755, 73.5093);
    }
  };

  // Get user's current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied, using default");
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error("Error getting current location:", error);
      return null;
    }
  };

  // Initial location setup - prefer Place Details API if placeId is available
  useEffect(() => {
    const initializeLocation = async () => {
      // Skip if editing - coordinates come from loadExistingAddress useEffect
      if (editId) {
        return;
      }

      // If coming from "set location on map", use current location
      if (source === "set-location") {
        const currentLocation = await getCurrentLocation();
        if (currentLocation) {
          setCoords(currentLocation);
          // Reverse geocode to get address
          await reverseGeocode(currentLocation.latitude, currentLocation.longitude);
        } else {
          // Fallback to default Male location if permission denied
          setCoords({ latitude: 4.1755, longitude: 73.5093 });
          await reverseGeocode(4.1755, 73.5093);
        }
        return;
      }

      if (selected.placeId) {
        // Use Place Details API for reliable geocoding
        const details = await getPlaceDetails(selected.placeId);
        if (details?.geometry?.location) {
          const { lat, lng } = details.geometry.location;
          setCoords({ latitude: lat, longitude: lng });
          // Update current map label and address display
          if (selected.label) {
            setCurrentMapLabel(selected.label);
          }
          if (details.formatted_address) {
            setCurrentMapAddress(details.formatted_address);
          }
        } else {
          // Fallback to geocoding if Place Details fails
          await fallbackGeocode();
        }
      } else if (selected.address) {
        // No placeId available, use geocoding
        if (selected.label) {
          setCurrentMapLabel(selected.label);
        }
        setCurrentMapAddress(selected.address);
        await fallbackGeocode();
      } else {
        // Default to Male, Maldives if no address provided
        setCoords({ latitude: 4.1755, longitude: 73.5093 });
        await reverseGeocode(4.1755, 73.5093);
      }
    };

    initializeLocation();
  }, [source, selected.placeId, selected.address, editId]);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.wrapper,
          { backgroundColor: theme.colors.system.background.default },
        ]}
      >
        {/* Scrollable container */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <Icon.back color={theme.colors.system.body.default} />
              </TouchableOpacity>
              <Text
                style={[
                  theme.typography.body.lg.medium,
                  { color: theme.colors.system.body.default },
                ]}
              >
                {editId ? "Edit Address" : "Address Details"}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Body */}
            <View style={styles.body}>
              <View style={styles.address}>
                <View
                  style={{ height: 200, borderRadius: 12, overflow: "hidden" }}
                >
                  {coords && (
                    <MapView
                      ref={mapRef}
                      provider={PROVIDER_GOOGLE}
                      style={StyleSheet.absoluteFillObject}
                      initialRegion={{
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                      }}
                      onRegionChangeComplete={(region) => {
                        setCoords({ latitude: region.latitude, longitude: region.longitude });
                        reverseGeocode(region.latitude, region.longitude);
                      }}
                      customMapStyle={isDark ? darkMapStyle : lightMapStyle}
                    />
                  )}
                  {/* Fixed center pin */}
                  <View style={styles.pinFixed} pointerEvents="none">
                    <Text style={{ fontSize: 32 }}>📍</Text>
                  </View>
                </View>
                <Text
                  style={[
                    theme.typography.body.xs.regular,
                    { color: theme.colors.system.body.disabled, marginTop: 4 },
                  ]}
                >
                  Move the map to adjust location
                </Text>

                <Text
                  style={[
                    theme.typography.body.md.regular,
                    { color: theme.colors.system.body.default },
                  ]}
                >
                  {currentMapLabel || "Selected Location"}
                </Text>
                <Text
                  style={[
                    theme.typography.body.md.regular,
                    { color: theme.colors.system.body.disabled },
                  ]}
                >
                  {currentMapAddress || "Move the map to select location"}
                </Text>
              </View>

              <TextField
                label="Address"
                placeholder="House/Apt number, floor, etc."
                value={addressLine}
                onChangeText={setAddressLine}
                required
              />

              <TextField
                label="Street/Magu"
                placeholder="e.g. Majeedhee Magu"
                value={street}
                onChangeText={setStreet}
                required
              />

              <TextField
                label="Landmark/Goalhi"
                placeholder="e.g. Near ADK Hospital"
                value={landmark}
                onChangeText={setLandmark}
                required
              />

              <BottomSheetDropdown
                label="Zone"
                sheetTitle="Select Zone"
                options={zones.map(z => z.name)}
                value={selectedZone}
                onSelect={setSelectedZone}
              />

              <View
                style={[
                  styles.labelGroup,
                  {
                    borderColor: theme.colors.system.border.default,
                    backgroundColor: theme.colors.system.background.default,
                  },
                ]}
              >
                <ToggleGroup
                  options={["Home", "Work", "Other"]}
                  initialValue={label}
                  onChange={(value) => setLabel(value)}
                  optionIcons={{
                    Home: (
                      <Icon.home color={theme.colors.system.body.default} />
                    ),
                    Work: (
                      <Icon.briefcase
                        color={theme.colors.system.body.default}
                      />
                    ),
                    Other: (
                      <Icon.pin color={theme.colors.system.body.default} />
                    ),
                  }}
                />

                {label === "Other" && (
                  <TextField
                    label="Address label"
                    placeholder="e.g. Mom's Place"
                    value={customLabel}
                    onChangeText={setCustomLabel}
                  />
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            { backgroundColor: theme.colors.system.background.secondary },
          ]}
        >
          {isSaving ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.system.body.default} />
              <Text
                style={[
                  theme.typography.body.md.regular,
                  { color: theme.colors.system.body.disabled },
                ]}
              >
                Saving address...
              </Text>
            </View>
          ) : (
            <View style={{ opacity: isFormValid ? 1 : 0.5 }}>
              <Button
                label="Save Address"
                variant="filled"
                onPress={isFormValid ? handleSaveAddress : undefined}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: "column",
  },
  address: {
    flexDirection: "column",
    gap: 2,
  },
  container: {
    paddingHorizontal: 16,
    flexDirection: "column",
    gap: 16,
    flex: 1,
  },
  body: {
    flexDirection: "column",
    gap: 16,
  },
  scrollContent: {
    paddingBottom: 180,
  },
  labelGroup: {
    borderTopWidth: 0.5,
    paddingTop: 12,
    flexDirection: "column",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  pinFixed: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -16,
    marginTop: -32,
  },
});

export default SaveAddress;
