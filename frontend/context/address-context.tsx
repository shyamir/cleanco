// app/context/address-context.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { addressApi, Address as BackendAddress } from "@/services/addressService";

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
  // Load addresses from backend
  loadAddresses: () => Promise<void>;
  // Clear selected address
  clearSelected: () => void;
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
      const addresses = await addressApi.getUserAddresses();
      setSavedAddresses(addresses);
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
