import React, { createContext, useContext, useState, ReactNode } from "react";
import { CLEANING_PRICING } from "@/constants/pricing";
import { PaymentMethod } from "@/services/bookingService";

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
  service: string;
  setService: (value: string) => void;
  // New fields for backend integration
  addressId: string | null;
  setAddressId: (value: string | null) => void;
  timeSlotId: string | null;
  setTimeSlotId: (value: string | null) => void;
  selectedDays: number[];
  setSelectedDays: (value: number[]) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (value: PaymentMethod) => void;
  isLoadingPrice: boolean;
  setIsLoadingPrice: (value: boolean) => void;
  // Reset function to clear booking state
  resetBooking: () => void;
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
  const [service, setService] = useState("");
  // New state for backend integration
  const [addressId, setAddressId] = useState<string | null>(null);
  const [timeSlotId, setTimeSlotId] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  const resetBooking = () => {
    setBedrooms(1);
    setBathrooms(1);
    setPet("None");
    setOtherPet("");
    setSchedule("");
    setInstructions("");
    setFrequency("Once");
    setTotal(CLEANING_PRICING[1]?.["Once"] || 435);
    setStartDate("");
    setService("");
    setAddressId(null);
    setTimeSlotId(null);
    setSelectedDays([]);
    setPaymentMethod(PaymentMethod.BANK_TRANSFER);
    setIsLoadingPrice(false);
  };

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
        service,
        setService,
        addressId,
        setAddressId,
        timeSlotId,
        setTimeSlotId,
        selectedDays,
        setSelectedDays,
        paymentMethod,
        setPaymentMethod,
        isLoadingPrice,
        setIsLoadingPrice,
        resetBooking,
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
