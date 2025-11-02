// src/hooks/useCleaningBooking.ts
import { useState, useEffect } from "react";
import { CLEANING_PRICING } from "@/constants/pricing";

const useCleaningBooking = () => {
  const [step, setStep] = useState<"selection" | "schedule">("selection");
  const [frequency, setFrequency] = useState("Once");
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [total, setTotal] = useState(0);

  type Slot = { day: string; time: string };
  const emptySlots: Slot[] = [
    { day: "", time: "" },
    { day: "", time: "" },
    { day: "", time: "" },
  ];
  const [slots, setSlots] = useState<Slot[]>(emptySlots);

  const handleNext = () => {
    setStep("schedule");
    setSlots(emptySlots);
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

  useEffect(() => {
    const price = CLEANING_PRICING[bedrooms]?.[frequency] || 435;
    setTotal(price);
  }, [bedrooms, frequency]);

  useEffect(() => setSlots(emptySlots), [frequency]);
  useEffect(() => {
    if (step === "selection") setSlots(emptySlots);
  }, [step]);

  return {
    step,
    setStep,
    frequency,
    setFrequency,
    bedrooms,
    setBedrooms,
    bathrooms,
    setBathrooms,
    total,
    slots,
    setSlots,
    handleNext,
    isSelectionValid,
  };
};

export default useCleaningBooking;