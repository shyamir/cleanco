// app/context/address-context.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

type Address = {
  label: string;
  address: string;
};

type AddressContextType = {
  selected: Address;
  setSelected: (address: Address) => void;
};

const AddressContext = createContext<AddressContextType | null>(null);

export const AddressProvider = ({ children }: { children: ReactNode }) => {
  const [selected, setSelected] = useState<Address>({
    label: "Home",
    address: "Hiyaa Tower H12",
  });

  return (
    <AddressContext.Provider value={{ selected, setSelected }}>
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error("useAddress must be used within AddressProvider");
  return ctx;
};
