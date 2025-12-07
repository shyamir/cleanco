import { useEffect, useState, useRef, useCallback } from "react";
import { useBooking } from "@/context/booking-context";
import { CLEANING_PRICING } from "@/constants/pricing";
import {
  bookingApi,
  ServiceType,
  mapFrequencyToBackend,
} from "@/services/bookingService";

const useCleaningBooking = () => {
  const {
    bedrooms,
    setBedrooms,
    bathrooms,
    setBathrooms,
    frequency,
    setFrequency,
    total,
    setTotal,
    setSchedule,
    isLoadingPrice,
    setIsLoadingPrice,
  } = useBooking();

  type Slot = { day: string; time: string };
  const emptySlots: Slot[] = [
    { day: "", time: "" },
    { day: "", time: "" },
    { day: "", time: "" },
  ];
  const [slots, setSlots] = useState<Slot[]>(emptySlots);
  const [step, setStep] = useState<"selection" | "schedule">("selection");
  const [priceError, setPriceError] = useState<string | null>(null);

  // Ref to track the latest request and cancel stale ones
  const priceRequestRef = useRef<number>(0);

  const handleNext = () => {
    setStep("schedule");
    setSlots(emptySlots);
  };

  const handleScheduleChange = (newSlots: Slot[]) => {
    setSlots(newSlots);
    // Combine all slots into a display string
    const scheduleStr = newSlots
      .filter((s) => s.day && s.time)
      .map((s) => `${s.day}, ${s.time}`)
      .join(" | ");
    setSchedule(scheduleStr);
  };

  const isSelectionValid = () => {
    if (frequency === "Once") return !!slots[0].time;
    if (frequency === "1x /week") return !!slots[0].day && !!slots[0].time;
    if (frequency === "2x /week")
      return (
        !!slots[0].day && !!slots[1].day && !!slots[0].time && !!slots[1].time
      );
    if (frequency === "3x /week") return slots.every((s) => s.day && s.time);
    return false;
  };

  // Fetch price from backend with debounce
  const fetchPrice = useCallback(async () => {
    const requestId = ++priceRequestRef.current;

    // Map frontend frequency to backend format
    const { isSubscription, subscriptionFrequency } =
      mapFrequencyToBackend(frequency);

    setIsLoadingPrice(true);
    setPriceError(null);

    try {
      const response = await bookingApi.calculateQuote({
        serviceType: ServiceType.HOME,
        bedrooms,
        frequency: subscriptionFrequency,
      });

      // Only update if this is still the latest request
      if (requestId === priceRequestRef.current) {
        setTotal(response.pricing.finalPrice);
      }
    } catch (error) {
      console.error("Failed to fetch price:", error);
      // Only update error if this is still the latest request
      if (requestId === priceRequestRef.current) {
        setPriceError("Failed to fetch price");
        // Fallback to static pricing
        const fallbackPrice = CLEANING_PRICING[bedrooms]?.[frequency] || 435;
        setTotal(fallbackPrice);
      }
    } finally {
      if (requestId === priceRequestRef.current) {
        setIsLoadingPrice(false);
      }
    }
  }, [bedrooms, frequency, setTotal, setIsLoadingPrice]);

  // Debounced price fetch when bedrooms or frequency change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchPrice();
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [fetchPrice]);

  // Reset slots when frequency changes or step changes
  useEffect(() => setSlots(emptySlots), [frequency]);
  useEffect(() => {
    if (step === "selection") setSlots(emptySlots);
  }, [step]);

  return {
    step,
    setStep,
    bedrooms,
    setBedrooms,
    bathrooms,
    setBathrooms,
    frequency,
    setFrequency,
    total,
    slots,
    setSlots: handleScheduleChange,
    handleNext,
    isSelectionValid,
    isLoadingPrice,
    priceError,
  };
};

export default useCleaningBooking;
