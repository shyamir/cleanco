import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TextInput,
  Animated,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/constants/icon";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";
import SegmentedButton from "@/components/segmentedButton";
import SearchBar from "@/components/searchBar";
import axios from "axios";
import { useAddress } from "@/context/address-context";
import { useBooking } from "@/context/booking-context";

// Replace this with your actual API key or import from env
const GOOGLE_MAPS_API_KEY = "AIzaSyCExFwNPZx7589yT31YLEFOidnQsDgXkvg";

const AddressSearch = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { selected, setSelected, savedAddresses, loadAddresses, isLoading } = useAddress();
  const { setAddressId } = useBooking();

  const [activeTab, setActiveTab] = useState("New");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const searchInputRef = useRef<TextInput>(null);
  const translateY = useRef(new Animated.Value(0)).current;

  // Load saved addresses when Saved tab is selected
  useEffect(() => {
    if (activeTab === "Saved") {
      loadAddresses();
    }
  }, [activeTab, loadAddresses]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100); // small delay ensures the component is mounted

    return () => clearTimeout(timeout);
  }, []);

  // Fetch Google Places suggestions
  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        console.log("Query:", query); // ✅ log the query as user types

        const res = await axios.get(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
          {
            params: {
              input: query,
              key: GOOGLE_MAPS_API_KEY,
              // types: "address",
              components: "country:mv", // Maldives only
            },
          }
        );

        if (res.data?.predictions) {
          setSuggestions(res.data.predictions);
          console.log("Suggestions:", res.data.predictions); // ✅ log results
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Keyboard animation
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardWillShow", (e) => {
      Animated.timing(translateY, {
        toValue: -e.endCoordinates.height + 20,
        duration: e.duration || 250,
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener("keyboardWillHide", () => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSelectAddress = (id: string | undefined, label: string, address: string) => {
    setSelected({ id, label, address });
    // Store the addressId in booking context if it exists
    if (id) {
      setAddressId(id);
    }
    router.back(); // return to previous screen
  };

  const renderNewItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        // Extract main_text and secondary_text
        const label = item.structured_formatting?.main_text || item.description;
        const address =
          item.structured_formatting?.secondary_text || item.description;

        // Save in context with place_id for reliable geocoding
        setSelected({
          placeId: item.place_id,
          label,
          address
        });

        // Navigate to SaveAddress screen with params
        router.push({
          pathname: "/save-address",
          params: {
            source: "address-search",
            returnTo: "home-cleaning", // or whatever logic you need
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
        {item.structured_formatting?.main_text || item.description}
      </Text>
      <Text
        style={[
          theme.typography.body.md.regular,
          { color: theme.colors.system.body.disabled },
        ]}
      >
        {item.structured_formatting?.secondary_text || ""}
      </Text>
    </TouchableOpacity>
  );

  // Get icon based on label
  const getAddressIcon = (label?: string) => {
    switch (label?.toLowerCase()) {
      case "home":
        return Icon.home;
      case "work":
        return Icon.briefcase;
      default:
        return Icon.pin;
    }
  };

  const renderSavedItem = ({ item }: { item: any }) => {
    const AddressIcon = getAddressIcon(item.label);
    const displayAddress = item.streetAddress || item.address;

    return (
      <TouchableOpacity
        style={styles.savedItem}
        onPress={() => handleSelectAddress(item.id, item.label || "Address", displayAddress)}
      >
        <View style={styles.savedRow}>
          <AddressIcon color={theme.colors.system.body.default} />
          <View>
            <Text
              style={[
                theme.typography.body.md.regular,
                { color: theme.colors.system.body.default },
              ]}
            >
              {item.label || "Address"}
            </Text>
            <Text
              style={[
                theme.typography.body.md.regular,
                { color: theme.colors.system.body.disabled },
              ]}
            >
              {displayAddress}
            </Text>
          </View>
        </View>

        {selected.id === item.id && (
          <Icon.check color={theme.colors.system.body.default} />
        )}
      </TouchableOpacity>
    );
  };

  const handleSetLocationOnMap = () => {
    // Use the current query as label/address
    const label = query || "Selected location";
    const address = query || "";

    // Save in context (optional, you can also handle this in SaveAddress)
    setSelected({ label, address });

    // Navigate to SaveAddress screen
    router.push({
      pathname: "/save-address",
      params: {
        source: "address-search",
        returnTo: "home-cleaning", // adjust based on your flow
      },
    });
  };

  return (
    <SafeAreaProvider>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SafeAreaView
          style={[
            styles.container,
            { backgroundColor: theme.colors.system.background.default },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Icon.back color={theme.colors.system.body.default} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <SegmentedButton
            tabs={["New", "Saved"]}
            activeTab={activeTab}
            onTabPress={(tab) => setActiveTab(tab)}
          />

          {/* New Tab */}
          {activeTab === "New" && (
            <>
              <Animated.View style={{ transform: [{ translateY }] }}>
                <SearchBar
                  ref={searchInputRef}
                  value={query}
                  onChangeText={setQuery}
                  onClear={() => {
                    setQuery("");
                    setSuggestions([]);
                  }}
                  placeholder="Search address"
                />
              </Animated.View>

              <FlatList
                data={suggestions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderNewItem}
                keyboardShouldPersistTaps="handled"
                ListFooterComponent={
                  <TouchableOpacity
                    style={styles.setLocationBtn}
                    onPress={() => {
                      // Clear selected address to trigger current location in save-address
                      setSelected({ label: "Current Location", address: "" });
                      router.push({
                        pathname: "/save-address",
                        params: {
                          source: "set-location",
                          returnTo: "home-cleaning",
                        },
                      });
                    }}
                  >
                    <Icon.pin color={theme.colors.system.body.default} />
                    <Text
                      style={[
                        theme.typography.body.md.regular,
                        { color: theme.colors.system.body.default },
                      ]}
                    >
                      Set location on map
                    </Text>
                  </TouchableOpacity>
                }
              />
            </>
          )}

          {/* Saved Tab */}
          {activeTab === "Saved" && (
            <>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.system.body.default} />
                  <Text
                    style={[
                      theme.typography.body.md.regular,
                      { color: theme.colors.system.body.disabled },
                    ]}
                  >
                    Loading saved addresses...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={savedAddresses}
                  keyExtractor={(item) => item.id}
                  renderItem={renderSavedItem}
                  contentContainerStyle={{ paddingTop: 8 }}
                  ListEmptyComponent={
                    <Text
                      style={[
                        theme.typography.body.md.regular,
                        {
                          color: theme.colors.system.body.disabled,
                          textAlign: "center",
                          marginTop: 32,
                        },
                      ]}
                    >
                      No saved addresses
                    </Text>
                  }
                />
              )}
            </>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    flexDirection: "column",
    gap: 16,
  },
  header: { flexDirection: "row", alignItems: "center" },
  suggestionItem: { paddingVertical: 8 },
  setLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  savedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 32,
  },
});

export default AddressSearch;
