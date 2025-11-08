import React, { createContext, useContext, useState, ReactNode } from "react";
import { CLEANING_PRICING } from "@/constants/pricing";

type BookingContextType = {
  bedrooms: number;
  setBedrooms: (value: number) => void;
  bathrooms: number;
  setBathrooms: (value: number) => void;
  pet: string;
  setPet: (value: string) => void;
  otherPet: string;
  setOtherPet: (value: string) => void;
  schedule: string;
  setSchedule: (value: string) => void;
  instructions: string;
  setInstructions: (value: string) => void;
  total: number;
  setTotal: (value: number) => void;
  frequency: string;
  setFrequency: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [pet, setPet] = useState("None");
  const [otherPet, setOtherPet] = useState("");
  const [schedule, setSchedule] = useState("");
  const [instructions, setInstructions] = useState("");
  const [frequency, setFrequency] = useState("Once");
  const [total, setTotal] = useState(CLEANING_PRICING[1]?.["Once"] || 435);
  const [startDate, setStartDate] = useState("");

  return (
    <BookingContext.Provider
      value={{
        bedrooms,
        setBedrooms,
        bathrooms,
        setBathrooms,
        pet,
        setPet,
        otherPet,
        setOtherPet,
        schedule,
        setSchedule,
        instructions,
        setInstructions,
        total,
        setTotal,
        frequency,
        setFrequency,
        startDate,
        setStartDate,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context)
    throw new Error("useBooking must be used within BookingProvider");
  return context;
};
