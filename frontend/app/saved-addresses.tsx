import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/constants/icon";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";
import { useAddress, SavedAddress } from "@/context/address-context";
import { addressApi } from "@/services/addressService";
import Button from "@/components/button";

const Shortcuts = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { savedAddresses, loadAddresses, isLoading } = useAddress();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const getIconForLabel = (label?: string) => {
    switch (label) {
      case "Home":
        return <Icon.home color={theme.colors.system.body.default} />;
      case "Work":
        return <Icon.briefcase color={theme.colors.system.body.default} />;
      default:
        return <Icon.pin color={theme.colors.system.body.default} />;
    }
  };

  const formatAddress = (address: SavedAddress) => {
    return [address.address, address.street, address.landmark]
      .filter(Boolean)
      .join(", ");
  };

  const handleDelete = (address: SavedAddress) => {
    Alert.alert(
      "Delete Address",
      `Are you sure you want to delete "${address.label || "this address"}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(address.id);
            try {
              await addressApi.deleteAddress(address.id);
              await loadAddresses();
            } catch (error: any) {
              console.error("Failed to delete address:", error);
              const errorMessage = error.response?.data?.message || "Failed to delete address";
              Alert.alert("Cannot Delete", errorMessage);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const renderAddressItem = ({ item }: { item: SavedAddress }) => (
    <TouchableOpacity
      style={[
        styles.addressRow,
        { backgroundColor: theme.colors.system.background.secondary },
      ]}
      onPress={() => router.push(`/save-address?editId=${item.id}&source=saved-addresses`)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>{getIconForLabel(item.label)}</View>
      <View style={styles.addressContent}>
        <Text
          style={[
            theme.typography.body.md.medium,
            { color: theme.colors.system.body.default },
          ]}
        >
          {item.label || "Address"}
        </Text>
        <Text
          style={[
            theme.typography.body.sm.regular,
            { color: theme.colors.system.body.disabled },
          ]}
          numberOfLines={1}
        >
          {formatAddress(item)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
        disabled={deletingId === item.id}
      >
        {deletingId === item.id ? (
          <ActivityIndicator size="small" color={theme.colors.system.body.disabled} />
        ) : (
          <Icon.trash color={theme.colors.button.label.error} />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.system.background.default },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("/account")}>
            <Icon.back color={theme.colors.system.body.default} />
          </TouchableOpacity>
          <Text
            style={[
              theme.typography.body.lg.medium,
              { color: theme.colors.system.body.default },
            ]}
          >
            Saved Addresses
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.system.body.default} />
          </View>
        ) : savedAddresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon.location color={theme.colors.system.body.disabled} />
            <Text
              style={[
                theme.typography.body.md.regular,
                { color: theme.colors.system.body.disabled, marginTop: 12 },
              ]}
            >
              No saved addresses yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={savedAddresses}
            renderItem={renderAddressItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        )}

        {/* Add Address Button */}
        <View
          style={[
            styles.footer,
            { backgroundColor: theme.colors.system.background.secondary },
          ]}
        >
          <Button
            label="Add New Address"
            variant="filled"
            onPress={() => router.push("/address-search?returnTo=saved-addresses")}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addressContent: {
    flex: 1,
    marginLeft: 12,
  },
  deleteButton: {
    padding: 8,
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
    shadowOffset: { width: 0, height: -2 },
    elevation: 2,
  },
});

export default Shortcuts;
