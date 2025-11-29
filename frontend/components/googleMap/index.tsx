import React from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useTheme } from "@/theme/ThemeProvider";

// Monochrome light style (Google Map Style Designer)
const lightMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }],
  },
];

// Monochrome dark style
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#1e1e1e" }],
  },
];

const GoogleMap = () => {
  const { mode } = useTheme(); // "light" or "dark"

  // Choose the correct style based on theme
  const customStyle = mode === "dark" ? darkMapStyle : lightMapStyle;

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 6.9271,
          longitude: 79.8612,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        customMapStyle={customStyle} // monochrome style
      >
        <Marker
          coordinate={{ latitude: 6.9271, longitude: 79.8612 }}
          title="Colombo"
          description={`Monochrome ${mode} map`}
        />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});

export default GoogleMap;
