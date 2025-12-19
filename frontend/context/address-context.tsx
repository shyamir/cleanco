// app/context/address-context.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addressApi, Address as BackendAddress } from "@/services/addressService";

const ADDRESSES_STORAGE_KEY = 'savedAddresses';

// Selected address type for booking flow
type SelectedAddress = {
  id?: string; // Backend address ID (if saved)
  placeId?: string; // Google Places ID (for geocoding)
  longitude?: number;
  latitude?: number;
  label: string;
  address: string;
  // Additional fields for backend
  streetAddress?: string;
  city?: string;
  island?: string;
};

type AddressContextType = {
  // Currently selected address for booking
  selected: SelectedAddress;
  setSelected: (address: SelectedAddress) => void;
  // Saved addresses from backend
  savedAddresses: BackendAddress[];
  setSavedAddresses: (addresses: BackendAddress[]) => void;
  // Loading state
  isLoading: boolean;
  // Error state
  error: string | null;
  // Load addresses from backend (checks cache first)
  loadAddresses: () => Promise<void>;
  // Clear selected address
  clearSelected: () => void;
  // Cache management functions
  clearAddresses: () => Promise<void>;
  addAddressToCache: (address: BackendAddress) => Promise<void>;
  updateAddressInCache: (address: BackendAddress) => Promise<void>;
  removeAddressFromCache: (id: string) => Promise<void>;
};

const AddressContext = createContext<AddressContextType | null>(null);

export const AddressProvider = ({ children }: { children: ReactNode }) => {
  const [selected, setSelected] = useState<SelectedAddress>({
    label: "",
    address: "",
  });
  const [savedAddresses, setSavedAddresses] = useState<BackendAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Check AsyncStorage first
      const cached = await AsyncStorage.getItem(ADDRESSES_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as BackendAddress[];
        // Deduplicate by ID (keep the last occurrence)
        const deduped = parsed.reduce((acc: BackendAddress[], addr) => {
          const existingIndex = acc.findIndex(a => a.id === addr.id);
          if (existingIndex >= 0) {
            acc[existingIndex] = addr; // Replace with newer
          } else {
            acc.push(addr);
          }
          return acc;
        }, []);
        setSavedAddresses(deduped);
        // Save deduped version back if there were duplicates
        if (deduped.length !== parsed.length) {
          await AsyncStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(deduped));
        }
        setIsLoading(false);
        return;
      }

      // No cache - fetch from backend and store
      const addresses = await addressApi.getUserAddresses();
      setSavedAddresses(addresses);
      await AsyncStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(addresses));
    } catch (err: any) {
      console.error("Failed to load addresses:", err);
      setError(err.message || "Failed to load addresses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSelected = useCallback(() => {
    setSelected({
      label: "",
      address: "",
    });
  }, []);

  const clearAddresses = useCallback(async () => {
    setSavedAddresses([]);
    await AsyncStorage.removeItem(ADDRESSES_STORAGE_KEY);
  }, []);

  const addAddressToCache = useCallback(async (address: BackendAddress) => {
    // Check if address already exists (prevent duplicates)
    const exists = savedAddresses.some(a => a.id === address.id);

    let updated: BackendAddress[];
    if (exists) {
      // If it exists, update it instead (same logic as updateAddressInCache)
      updated = savedAddresses.map(a => {
        if (a.id === address.id) {
          return address;
        }
        if ((address.label === "Home" || address.label === "Work") && a.label === address.label) {
          return { ...a, label: undefined };
        }
        return a;
      });
    } else {
      // If new address has label "Home" or "Work", remove that label from any existing address
      updated = savedAddresses.map(a => {
        if ((address.label === "Home" || address.label === "Work") && a.label === address.label) {
          return { ...a, label: undefined };
        }
        return a;
      });
      updated = [...updated, address];
    }

    setSavedAddresses(updated);
    await AsyncStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(updated));
  }, [savedAddresses]);

  const updateAddressInCache = useCallback(async (address: BackendAddress) => {
    // If updated address has label "Home" or "Work", remove that label from any OTHER address
    const updated = savedAddresses.map(a => {
      if (a.id === address.id) {
        return address;
      }
      // Remove Home/Work label from other addresses if this address now has it
      if ((address.label === "Home" || address.label === "Work") && a.label === address.label) {
        return { ...a, label: undefined };
      }
      return a;
    });
    setSavedAddresses(updated);
    await AsyncStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(updated));
  }, [savedAddresses]);

  const removeAddressFromCache = useCallback(async (id: string) => {
    const updated = savedAddresses.filter(a => a.id !== id);
    setSavedAddresses(updated);
    await AsyncStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(updated));
  }, [savedAddresses]);

  return (
    <AddressContext.Provider
      value={{
        selected,
        setSelected,
        savedAddresses,
        setSavedAddresses,
        isLoading,
        error,
        loadAddresses,
        clearSelected,
        clearAddresses,
        addAddressToCache,
        updateAddressInCache,
        removeAddressFromCache,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error("useAddress must be used within AddressProvider");
  return ctx;
};

// Re-export BackendAddress type for convenience
export type { BackendAddress as SavedAddress };
