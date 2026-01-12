import React, { createContext, useContext, useState, ReactNode } from "react";
import { CLEANING_PRICING } from "@/constants/pricing";
import { PaymentMethod, DaySlot, CheckoutSessionResponse } from "@/services/bookingService";
import { PricingRule } from "@/services/services";

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
  daySlots: DaySlot[];
  setDaySlots: (value: DaySlot[]) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (value: PaymentMethod) => void;
  isLoadingPrice: boolean;
  setIsLoadingPrice: (value: boolean) => void;
  // Promo code fields
  promoCode: string | null;
  setPromoCode: (value: string | null) => void;
  promoDiscount: number;
  setPromoDiscount: (value: number) => void;
  promoDiscountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | null;
  setPromoDiscountType: (value: 'PERCENTAGE' | 'FIXED_AMOUNT' | null) => void;
  promoDiscountValue: number;
  setPromoDiscountValue: (value: number) => void;
  originalTotal: number;
  setOriginalTotal: (value: number) => void;
  // Office cleaning specific fields
  squareFeet: number;
  setSquareFeet: (value: number) => void;
  rooms: number;
  setRooms: (value: number) => void;
  toilets: number;
  setToilets: (value: number) => void;
  isEstimate: boolean;
  setIsEstimate: (value: boolean) => void;
  // Reset function to clear booking state
  resetBooking: () => void;
  // Home pricing cache (persists across navigations)
  homePricingRules: PricingRule[];
  setHomePricingRules: (rules: PricingRule[]) => void;
  homePricingLoaded: boolean;
  setHomePricingLoaded: (loaded: boolean) => void;
  // Checkout session (created before navigating to payment)
  checkoutSession: CheckoutSessionResponse | null;
  setCheckoutSession: (session: CheckoutSessionResponse | null) => void;
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
  const [daySlots, setDaySlots] = useState<DaySlot[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  // Promo code state
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoDiscountType, setPromoDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT' | null>(null);
  const [promoDiscountValue, setPromoDiscountValue] = useState(0);
  const [originalTotal, setOriginalTotal] = useState(0);
  // Office cleaning specific state
  const [squareFeet, setSquareFeet] = useState(200);
  const [rooms, setRooms] = useState(1);
  const [toilets, setToilets] = useState(1);
  const [isEstimate, setIsEstimate] = useState(false);
  // Home pricing cache (persists across navigations)
  const [homePricingRules, setHomePricingRules] = useState<PricingRule[]>([]);
  const [homePricingLoaded, setHomePricingLoaded] = useState(false);
  // Checkout session (created before navigating to payment)
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSessionResponse | null>(null);

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
    setDaySlots([]);
    setPaymentMethod(PaymentMethod.BANK_TRANSFER);
    setIsLoadingPrice(false);
    // Note: Don't reset promoCode - user may have applied it from home carousel before starting booking
    // Promo will be validated on review page. Reset discount values so they get recalculated.
    setPromoDiscount(0);
    setPromoDiscountType(null);
    setPromoDiscountValue(0);
    setOriginalTotal(0);
    // Reset office-specific fields
    setSquareFeet(200);
    setRooms(1);
    setToilets(1);
    setIsEstimate(false);
    // Reset pricing cache to fetch fresh prices
    setHomePricingLoaded(false);
    // Clear checkout session
    setCheckoutSession(null);
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
        daySlots,
        setDaySlots,
        paymentMethod,
        setPaymentMethod,
        isLoadingPrice,
        setIsLoadingPrice,
        promoCode,
        setPromoCode,
        promoDiscount,
        setPromoDiscount,
        promoDiscountType,
        setPromoDiscountType,
        promoDiscountValue,
        setPromoDiscountValue,
        originalTotal,
        setOriginalTotal,
        squareFeet,
        setSquareFeet,
        rooms,
        setRooms,
        toilets,
        setToilets,
        isEstimate,
        setIsEstimate,
        resetBooking,
        homePricingRules,
        setHomePricingRules,
        homePricingLoaded,
        setHomePricingLoaded,
        checkoutSession,
        setCheckoutSession,
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
