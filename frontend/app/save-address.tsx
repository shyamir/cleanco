import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/constants/icon";
import { useTheme } from "@/theme/useTheme";
import { useRouter } from "expo-router";
import Button from "@/components/button";
import TextField from "@/components/inputs/textfield";
import BottomSheetDropdown from "@/components/bottomSheetDropdown";
import { useAddress } from "@/context/address-context";
import ToggleGroup from "@/components/toggleButton/toggleGroup";

const SaveAddress = () => {
  const theme = useTheme();
  const router = useRouter();
  const { selected, setSelected } = useAddress();

  // --- State ---
  const [buildingType, setBuildingType] = useState("House");
  const [landmark, setLandmark] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  const [label, setLabel] = useState("");

  // --- Generate dynamic fields ---
  const renderFields = () => {
    switch (buildingType) {
      case "House":
        return (
          <>
            <TextField
              label="Landmark*"
              placeholder="e.g. Across railway station"
              value={landmark}
              onChangeText={setLandmark}
            />
          </>
        );

      case "Apartment":
        return (
          <>
            <TextField
              label="Apt/Flat/Floor*"
              placeholder="e.g. Flat 5A"
              value={floor}
              onChangeText={setFloor}
            />
            <TextField
              label="Building name*"
              placeholder="e.g. Greenview Apartments"
              value={buildingName}
              onChangeText={setBuildingName}
            />
            <TextField
              label="Landmark*"
              placeholder="e.g. Near post office"
              value={landmark}
              onChangeText={setLandmark}
            />
          </>
        );

      case "Office":
        return (
          <>
            <TextField
              label="Business/Building name*"
              placeholder="e.g. Orion Towers"
              value={buildingName}
              onChangeText={setBuildingName}
            />
            <TextField
              label="Floor*"
              placeholder="e.g. 3rd Floor"
              value={floor}
              onChangeText={setFloor}
            />
            <TextField
              label="Landmark*"
              placeholder="e.g. Opposite Central Mall"
              value={landmark}
              onChangeText={setLandmark}
            />
          </>
        );

      case "Hotel":
        return (
          <>
            <TextField
              label="Hotel name*"
              placeholder="e.g. Cinnamon Grand"
              value={buildingName}
              onChangeText={setBuildingName}
            />
            <TextField
              label="Room/Floor*"
              placeholder="e.g. Room 504"
              value={room}
              onChangeText={setRoom}
            />
            <TextField
              label="Landmark*"
              placeholder="e.g. Near Galle Face"
              value={landmark}
              onChangeText={setLandmark}
            />
          </>
        );

      case "Other":
        return (
          <>
            <TextField
              label="Building name*"
              placeholder="e.g. Sunshine Plaza"
              value={buildingName}
              onChangeText={setBuildingName}
            />
            <TextField
              label="Landmark*"
              placeholder="e.g. Near City Bus Stop"
              value={landmark}
              onChangeText={setLandmark}
            />
          </>
        );

      default:
        return null;
    }
  };

  // SaveAddress.tsx -> handleSave
  const handleSave = () => {
    setSelected({
      label: label || selected.label, // keep existing label if not changed
      address: selected.address, // use the address from AddressSearch
    });

    router.replace("/home-cleaning");
  };

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
            </View>

            {/* Body */}
            <View style={styles.body}>
              <View style={styles.address}>
                <Text
                  style={[
                    theme.typography.body.md.regular,
                    { color: theme.colors.system.body.default },
                  ]}
                >
                  {selected?.label}
                </Text>
                <Text
                  style={[
                    theme.typography.body.md.regular,
                    { color: theme.colors.system.body.disabled },
                  ]}
                >
                  {selected?.address}
                </Text>
              </View>

              <BottomSheetDropdown
                label="Building Type"
                sheetTitle="Choose Builiding Type"
                options={["House", "Apartment", "Office", "Hotel", "Other"]}
                optionIcons={{
                  House: "home",
                  Apartment: "building",
                  Office: "briefcase",
                  Hotel: "hotel",
                  Other: "pin",
                }}
                value={buildingType}
                onSelect={setBuildingType}
              />

              {renderFields()}

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
                  initialValue="Home"
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
                    placeholder="e.g. Mom’s Place"
                    value={buildingName}
                    onChangeText={setBuildingName}
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
          <Button
            label="Save and Continue"
            variant="filled"
            onPress={handleSave}
          />
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
    paddingBottom: 120,
  },
  labelGroup: {
    borderTopWidth: 0.5,
    paddingTop: 12,
    flexDirection: "column",
    gap: 12,
  },
  header: { flexDirection: "row", alignItems: "center" },
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
});

export default SaveAddress;
