import { useEffect, useState, useCallback } from "react";
import { useBooking } from "@/context/booking-context";
import { CLEANING_PRICING } from "@/constants/pricing";
import { mapFrequencyToBackend } from "@/services/bookingService";
import { servicesApi, PricingRule } from "@/services/services";

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
    // Promo state for preserving discounts
    promoDiscount,
    setPromoDiscount,
    promoDiscountType,
    promoDiscountValue,
    originalTotal,
    setOriginalTotal,
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

  // Store pricing rules fetched from backend
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [rulesLoaded, setRulesLoaded] = useState(false);

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

  // Helper to apply promo discount to a base price
  const applyPromoToPrice = useCallback((basePrice: number) => {
    if (promoDiscountType && promoDiscountValue > 0) {
      let discount = 0;
      if (promoDiscountType === 'PERCENTAGE') {
        discount = (basePrice * promoDiscountValue) / 100;
      } else {
        discount = promoDiscountValue;
      }
      setPromoDiscount(discount);
      setOriginalTotal(basePrice);
      setTotal(Math.max(0, basePrice - discount));
    } else {
      setTotal(basePrice);
    }
  }, [promoDiscountType, promoDiscountValue, setPromoDiscount, setOriginalTotal, setTotal]);

  // Find price from cached pricing rules
  const findPriceFromRules = useCallback((bedroomCount: number, freq: string): number | null => {
    if (pricingRules.length === 0) return null;

    // Map frontend frequency to backend format
    const { subscriptionFrequency } = mapFrequencyToBackend(freq);
    const backendFrequency = subscriptionFrequency || null; // null for one-time

    const rule = pricingRules.find(
      (r) => r.bedrooms === bedroomCount && r.frequency === backendFrequency
    );

    return rule?.price ?? null;
  }, [pricingRules]);

  // Fetch all pricing rules once on mount
  useEffect(() => {
    const fetchPricingRules = async () => {
      setIsLoadingPrice(true);
      try {
        const rules = await servicesApi.getPricingRules('HOME');
        setPricingRules(rules);
        setRulesLoaded(true);
      } catch (error) {
        console.error("Failed to fetch pricing rules:", error);
        setPriceError("Failed to load pricing");
        setRulesLoaded(true); // Still mark as loaded so we can use fallback
      } finally {
        setIsLoadingPrice(false);
      }
    };

    fetchPricingRules();
  }, [setIsLoadingPrice]);

  // Calculate price locally when bedrooms or frequency changes
  useEffect(() => {
    if (!rulesLoaded) return;

    const price = findPriceFromRules(bedrooms, frequency);

    if (price !== null) {
      applyPromoToPrice(price);
      setPriceError(null);
    } else {
      // Fallback to static pricing if no rule found
      const fallbackPrice = CLEANING_PRICING[bedrooms]?.[frequency] || 435;
      applyPromoToPrice(fallbackPrice);
      setPriceError(null);
    }
  }, [bedrooms, frequency, rulesLoaded, findPriceFromRules, applyPromoToPrice]);

  // Reset slots when frequency changes or step changes
  useEffect(() => setSlots(emptySlots), [frequency]);
  useEffect(() => {
    if (step === "selection") setSlots(emptySlots);
  }, [step]);

  // Clear cached pricing rules (call after booking is confirmed)
  const clearPricingCache = useCallback(() => {
    setPricingRules([]);
    setRulesLoaded(false);
  }, []);

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
    clearPricingCache,
  };
};

export default useCleaningBooking;
