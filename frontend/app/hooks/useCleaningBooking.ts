import { useEffect, useState } from "react";
import { useBooking } from "@/context/booking-context";
import { CLEANING_PRICING } from "@/constants/pricing";

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
    setSchedule, // <-- get this from context
  } = useBooking();

  type Slot = { day: string; time: string };
  const emptySlots: Slot[] = [
    { day: "", time: "" },
    { day: "", time: "" },
    { day: "", time: "" },
  ];
  const [slots, setSlots] = useState<Slot[]>(emptySlots);
  const [step, setStep] = useState<"selection" | "schedule">("selection");

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
    setSchedule(scheduleStr); // <-- save to context
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

  // ✅ Update total whenever bedrooms or frequency change
  useEffect(() => {
    const price = CLEANING_PRICING[bedrooms]?.[frequency] || 435;
    setTotal(price);
  }, [bedrooms, frequency, setTotal]);

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
    setSlots: handleScheduleChange, // <-- override setter
    handleNext,
    isSelectionValid,
  };
};

export default useCleaningBooking;
