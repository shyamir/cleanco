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
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/constants/icon";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";
import SegmentedButton from "@/components/segmentedButton";
import SearchBar from "@/components/searchBar";
import { useFocusEffect } from "@react-navigation/native";
import { InteractionManager } from "react-native";
import Button from "@/components/button";
import { useAddress } from "@/context/address-context";

const AddressSearch = () => {
  const {theme} = useTheme();
  const router = useRouter();
  const { selected, setSelected } = useAddress();

  const [activeTab, setActiveTab] = useState("New");
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);
  const translateY = useRef(new Animated.Value(0)).current;

  // Hardcoded address data
  const hardcodedData = [
    {
      main_text: "Hiyaa Tower H11",
      secondary_text: "Nirolhu Magu, Male, Maldives",
    },
    {
      main_text: "Hiyaa Tower H3",
      secondary_text: "Hulhumale Phase 2, Maldives",
    },
    { main_text: "Hiyaa Tower H6", secondary_text: "Maldives" },
    {
      main_text: "Hiyaa Tower H15",
      secondary_text: "Hitihgas Magu, Male, Maldives",
    },
    {
      main_text: "Hiyaa Tower H4",
      secondary_text: "Hulhumale Phase 2, Nirolhu Magu, Male, Maldives",
    },
  ];

  const savedAddresses = [
    { id: "home", label: "Home", address: "Hiyaa Tower H15", icon: Icon.home },
    {
      id: "work",
      label: "Work",
      address: "Hiyaa Tower H13",
      icon: Icon.briefcase,
    },
    {
      id: "commercial",
      label: "Commercial",
      address: "Hiyaa Tower H14",
      icon: Icon.pin,
    },
  ];

  // Filter suggestions
  const filteredSuggestions = hardcodedData.filter((item) =>
    item.main_text.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (activeTab === "New") searchInputRef.current?.focus();
    }, 200);
    return () => clearTimeout(timeout);
  }, [activeTab]);

  useFocusEffect(
    React.useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        if (activeTab === "New") searchInputRef.current?.focus();
      });
      return () => task.cancel?.();
    }, [activeTab])
  );

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardWillShow", (e) => {
      Animated.timing(translateY, {
        toValue: -e.endCoordinates.height + 20,
        duration: e.duration || 250,
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener("keyboardWillHide", (e) => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: e.duration || 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSelectAddress = (label: string, address: string) => {
    setSelected({ label, address });
    router.back(); // Go back to HomeCleaningScreen
  };

  const renderNewItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        setSelected({
          label: item.main_text,
          address: item.secondary_text,
        });
        router.push("/save-address");
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

  const renderSavedItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.savedItem}
      onPress={() => handleSelectAddress(item.label, item.address)}
    >
      <View style={styles.savedRow}>
        <item.icon color={theme.colors.system.body.default} />
        <View>
          <Text
            style={[
              theme.typography.body.md.regular,
              { color: theme.colors.system.body.default },
            ]}
          >
            {item.label}
          </Text>
          <Text
            style={[
              theme.typography.body.md.regular,
              { color: theme.colors.system.body.disabled },
            ]}
          >
            {item.address}
          </Text>
        </View>
      </View>

      {selected.address === item.address && (
        <Icon.check color={theme.colors.system.body.default} />
      )}
    </TouchableOpacity>
  );

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
              <Animated.View>
                <SearchBar
                  ref={searchInputRef}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search address"
                />
              </Animated.View>

              <FlatList
                data={filteredSuggestions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderNewItem}
                keyboardShouldPersistTaps="handled"
                ListFooterComponent={
                  <TouchableOpacity style={styles.setLocationBtn}>
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
              <FlatList
                data={savedAddresses}
                keyExtractor={(item) => item.id}
                renderItem={renderSavedItem}
                contentContainerStyle={{ paddingTop: 8 }}
              />
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
});

export default AddressSearch;
