import { useEffect, useState, useCallback } from "react";
import { useBooking } from "@/context/booking-context";
import { CLEANING_PRICING } from "@/constants/pricing";
import { mapFrequencyToBackend } from "@/services/bookingService";
import { servicesApi } from "@/services/services";

// Module-level flag to prevent race conditions across multiple hook instances
let isFetchingHomePricing = false;

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
    // Service type to determine if we should fetch pricing
    service,
    // Home pricing cache from context (persists across navigations)
    homePricingRules,
    setHomePricingRules,
    homePricingLoaded,
    setHomePricingLoaded,
  } = useBooking();

  // Only fetch pricing for home bookings (office uses API quote on review page)
  const isHomeCleaning = service === "Home Cleaning";

  type Slot = { day: string; time: string };
  const emptySlots: Slot[] = [
    { day: "", time: "" },
    { day: "", time: "" },
    { day: "", time: "" },
  ];
  const [slots, setSlots] = useState<Slot[]>(emptySlots);
  const [step, setStep] = useState<"selection" | "schedule">("selection");
  const [priceError, setPriceError] = useState<string | null>(null);

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
    if (!homePricingRules || homePricingRules.length === 0) return null;

    // Map frontend frequency to backend format
    const { subscriptionFrequency } = mapFrequencyToBackend(freq);
    const backendFrequency = subscriptionFrequency || null; // null for one-time

    const rule = homePricingRules.find(
      (r) => r.bedrooms === bedroomCount && r.frequency === backendFrequency
    );

    return rule?.price ?? null;
  }, [homePricingRules]);

  // Fetch all pricing rules only for home cleaning (uses module-level flag to prevent race conditions)
  useEffect(() => {
    // Only fetch for home cleaning
    if (!isHomeCleaning) {
      return;
    }

    // Skip if already loaded or currently fetching (synchronous check prevents race conditions)
    if (homePricingLoaded || isFetchingHomePricing) {
      return;
    }

    // Set flag synchronously BEFORE async operation
    isFetchingHomePricing = true;

    const fetchPricingRules = async () => {
      setIsLoadingPrice(true);
      try {
        const rules = await servicesApi.getPricingRules('HOME');
        // Ensure we always set an array (API might return undefined on error)
        setHomePricingRules(Array.isArray(rules) ? rules : []);
        setHomePricingLoaded(true);
      } catch (error) {
        console.error("Failed to fetch pricing rules:", error);
        setPriceError("Failed to load pricing");
        setHomePricingRules([]); // Ensure empty array on error
        setHomePricingLoaded(true); // Still mark as loaded so we can use fallback
      } finally {
        setIsLoadingPrice(false);
        isFetchingHomePricing = false;
      }
    };

    fetchPricingRules();
  }, [isHomeCleaning, homePricingLoaded, setIsLoadingPrice, setHomePricingRules, setHomePricingLoaded]);

  // Calculate price locally when bedrooms or frequency changes (only for home cleaning)
  useEffect(() => {
    // Only calculate price for home cleaning
    if (!isHomeCleaning || !homePricingLoaded) return;

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
  }, [bedrooms, frequency, homePricingLoaded, findPriceFromRules, applyPromoToPrice, isHomeCleaning]);

  // Reset slots when frequency changes or step changes
  useEffect(() => setSlots(emptySlots), [frequency]);
  useEffect(() => {
    if (step === "selection") setSlots(emptySlots);
  }, [step]);

  // Clear cached pricing rules (call after booking is confirmed)
  const clearPricingCache = useCallback(() => {
    setHomePricingRules([]);
    setHomePricingLoaded(false);
  }, [setHomePricingRules, setHomePricingLoaded]);

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
