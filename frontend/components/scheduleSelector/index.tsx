// src/components/cleaningSchedule/index.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import ToggleCard from "@/components/card/toggleCard";
import DatePickerCard from "../card/datePickerCard";
import { useBooking } from "@/context/booking-context";
import {
  bookingApi,
  TimeSlot,
  AvailableSlot,
  SubscriptionSlotAvailability,
  mapDayToNumber,
  mapNumberToDay,
  ServiceType,
} from "@/services/bookingService";
import { useTheme } from "@/theme/ThemeProvider";
import Base from "@/components/card/base";
import dayjs from "dayjs";

type Slot = { day: string; time: string; timeSlotId?: string };

type ScheduleSelectorProps = {
  frequency: string;
  onChange?: (slots: Slot[]) => void;
  requiredCleaners?: number; // Override cleaner count (used for reschedule with manual adjustments)
};

const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({
  frequency,
  onChange,
  requiredCleaners,
}) => {
  const { theme } = useTheme();
  const [slots, setSlots] = useState<Slot[]>([
    { day: "", time: "" },
    { day: "", time: "" },
    { day: "", time: "" },
  ]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

  // State for subscription availability
  const [subscriptionSlots, setSubscriptionSlots] = useState<
    Map<number, SubscriptionSlotAvailability[]>
  >(new Map());
  const [isLoadingSubscriptionSlots, setIsLoadingSubscriptionSlots] = useState<
    Map<number, boolean>
  >(new Map());

  const { setSchedule, setTimeSlotId, setSelectedDays, setDaySlots, bedrooms, service } =
    useBooking();
  const { startDate, setStartDate } = useBooking();

  const dayOptions = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Get day of week from start date (0-6)
  const getStartDateDayOfWeek = useCallback((): number => {
    if (!startDate) return -1;
    return dayjs(startDate).day(); // 0 = Sunday, 6 = Saturday
  }, [startDate]);

  // Fetch all time slots on mount (for recurring bookings)
  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        setIsLoadingSlots(true);
        const slots = await bookingApi.getTimeSlots();
        // Filter only active slots
        const activeSlots = slots.filter((slot) => slot.isActive);
        setTimeSlots(activeSlots);
      } catch (error) {
        console.error("Failed to fetch time slots:", error);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchTimeSlots();
  }, []);

  // Auto-select first slot day when start date changes (for subscriptions)
  useEffect(() => {
    if (frequency === "Once" || !startDate) return;

    const dayOfWeek = getStartDateDayOfWeek();
    if (dayOfWeek >= 0) {
      const dayName = dayOptions[dayOfWeek];
      // Always reset when start date changes
      const updated = [...slots];
      updated[0] = { day: dayName, time: "", timeSlotId: undefined };
      // Clear subsequent slots
      for (let i = 1; i < updated.length; i++) {
        updated[i] = { day: "", time: "", timeSlotId: undefined };
      }
      setSlots(updated);
      onChange?.(updated);

      // Clear subscription availability for all slots
      setSubscriptionSlots(new Map());

      // Fetch availability for the first slot
      fetchSubscriptionAvailability(0, dayName);
    }
  }, [startDate, frequency]);

  // Fetch available slots when date changes (for one-time bookings)
  useEffect(() => {
    if (frequency !== "Once" || !startDate) return;

    // Reset selected time when date changes
    const updated = [...slots];
    updated[0] = { day: "", time: "", timeSlotId: undefined };
    setSlots(updated);
    onChange?.(updated);

    const fetchAvailableSlots = async () => {
      try {
        setIsLoadingSlots(true);
        // Pass booking details to check cleaner availability
        const serviceType =
          service === "Home Cleaning" ? ServiceType.HOME : ServiceType.OFFICE;
        const response = await bookingApi.getAvailableSlots(startDate, {
          serviceType,
          bedrooms,
          requiredCleaners,
        });

        setAvailableSlots(response.availableSlots);
      } catch (error) {
        console.error("Failed to fetch available slots:", error);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchAvailableSlots();
  }, [startDate, frequency, bedrooms, service, requiredCleaners]);

  // Fetch subscription availability for a specific slot
  const fetchSubscriptionAvailability = async (
    slotIndex: number,
    dayName: string
  ) => {
    if (!startDate || frequency === "Once") return;

    const dayOfWeek = mapDayToNumber(dayName);

    setIsLoadingSubscriptionSlots((prev) => {
      const newMap = new Map(prev);
      newMap.set(slotIndex, true);
      return newMap;
    });

    try {
      const serviceType =
        service === "Home Cleaning" ? ServiceType.HOME : ServiceType.OFFICE;
      const response = await bookingApi.getSubscriptionAvailability(
        startDate,
        dayOfWeek,
        {
          serviceType,
          bedrooms,
          requiredCleaners,
        }
      );

      setSubscriptionSlots((prev) => {
        const newMap = new Map(prev);
        newMap.set(slotIndex, response.availableSlots);
        return newMap;
      });
    } catch (error) {
      console.error("Failed to fetch subscription availability:", error);
    } finally {
      setIsLoadingSubscriptionSlots((prev) => {
        const newMap = new Map(prev);
        newMap.set(slotIndex, false);
        return newMap;
      });
    }
  };

  // Compute disabled days for each slot
  const getDisabledDaysForSlot = (slotIndex: number): string[] => {
    // Friday is always disabled (no bookings on Fridays)
    const alwaysDisabled = ["Friday"];

    if (frequency === "Once") return alwaysDisabled;

    // Slot 0: Only the start date's day is allowed (disable all others)
    if (slotIndex === 0) {
      const startDayIndex = getStartDateDayOfWeek();
      if (startDayIndex >= 0) {
        const disabled = dayOptions.filter((_, idx) => idx !== startDayIndex);
        // Ensure Friday is always disabled
        if (!disabled.includes("Friday")) {
          disabled.push("Friday");
        }
        return disabled;
      }
      return alwaysDisabled;
    }

    // Subsequent slots: disable previously selected days + Friday
    const disabled: string[] = [...alwaysDisabled];
    for (let i = 0; i < slotIndex; i++) {
      if (slots[i].day && !disabled.includes(slots[i].day)) {
        disabled.push(slots[i].day);
      }
    }
    return disabled;
  };

  // Get time options for a specific slot (for subscriptions)
  const getTimeOptionsForSlot = (slotIndex: number): string[] => {
    if (frequency === "Once") {
      return availableSlots.map((slot) => slot.displayTime);
    }

    const slotData = subscriptionSlots.get(slotIndex);
    if (!slotData || slotData.length === 0) {
      return timeSlots.map((s) => s.displayStartTime);
    }
    return slotData.map((s) => s.displayTime);
  };

  // Get disabled time options for a specific slot (for subscriptions)
  const getDisabledTimeOptionsForSlot = (slotIndex: number): string[] => {
    if (frequency === "Once") {
      return availableSlots
        .filter((slot) => !slot.isAvailable)
        .map((slot) => slot.displayTime);
    }

    const slotData = subscriptionSlots.get(slotIndex);
    if (!slotData) return [];
    return slotData
      .filter((s) => !s.isAvailableFor12Weeks)
      .map((s) => s.displayTime);
  };

  // Check if all time slots are unavailable for a slot
  const allTimeSlotsUnavailable = (slotIndex: number): boolean => {
    const slotData = subscriptionSlots.get(slotIndex);
    if (!slotData || slotData.length === 0) return false;
    return slotData.every((s) => !s.isAvailableFor12Weeks);
  };

  // Find timeSlotId by display time string
  const findTimeSlotId = (
    displayTime: string,
    slotIndex: number
  ): string | undefined => {
    if (frequency === "Once") {
      const slot = availableSlots.find((s) => s.displayTime === displayTime);
      return slot?.id;
    }

    const slotData = subscriptionSlots.get(slotIndex);
    if (slotData) {
      const slot = slotData.find((s) => s.displayTime === displayTime);
      return slot?.id;
    }

    const slot = timeSlots.find((s) => s.displayStartTime === displayTime);
    return slot?.id;
  };

  const updateSlot = (index: number, key: keyof Slot, value: string) => {
    const updated = [...slots];
    updated[index][key] = value;

    // If day is being updated, clear this slot's time and all subsequent slots
    if (key === "day") {
      updated[index].time = "";
      updated[index].timeSlotId = undefined;

      // Clear subsequent slots
      for (let i = index + 1; i < updated.length; i++) {
        updated[i] = { day: "", time: "", timeSlotId: undefined };
      }

      // Clear subscription availability for slots after this one
      setSubscriptionSlots((prev) => {
        const newMap = new Map();
        for (let i = 0; i <= index; i++) {
          if (prev.has(i)) newMap.set(i, prev.get(i));
        }
        return newMap;
      });

      // Fetch availability for the new day
      if (value) {
        fetchSubscriptionAvailability(index, value);
      }
    }

    // If time is being updated, also store the timeSlotId
    if (key === "time" && value) {
      const foundId = findTimeSlotId(value, index);
      updated[index].timeSlotId = foundId;
    }

    setSlots(updated);
    onChange?.(updated);

    // Update context schedule for review
    if (frequency === "Once") {
      const time = updated[0].time;
      const date = startDate;
      if (date && time) {
        setSchedule(`${date}, ${time}`);
      } else if (date) {
        setSchedule(date);
      }
      if (updated[0].timeSlotId) {
        setTimeSlotId(updated[0].timeSlotId);
      }
    } else {
      // For recurring bookings, build schedule string
      const scheduleStr = updated
        .filter((s) => s.day && s.time)
        .map((s) => `${s.day} ${s.time}`)
        .join(" | ");
      setSchedule(scheduleStr);

      // Store the first timeSlotId for backward compatibility
      const firstSlotWithTime = updated.find((s) => s.timeSlotId);
      if (firstSlotWithTime?.timeSlotId) {
        setTimeSlotId(firstSlotWithTime.timeSlotId);
      }

      // Store selected days as numbers for backward compatibility
      const days = updated.filter((s) => s.day).map((s) => mapDayToNumber(s.day));
      setSelectedDays(days);

      // Store daySlots for backend (day-timeSlotId pairs)
      const daySlotsPairs = updated
        .filter((s) => s.day && s.timeSlotId)
        .map((s) => ({
          day: mapDayToNumber(s.day),
          timeSlotId: s.timeSlotId!,
        }));
      setDaySlots(daySlotsPairs);
    }
  };

  const renderSlotCard = (index: number) => {
    const isLoading = isLoadingSubscriptionSlots.get(index) || false;
    const disabledDays = getDisabledDaysForSlot(index);
    const timeOpts = getTimeOptionsForSlot(index);
    const disabledTimeOpts = getDisabledTimeOptionsForSlot(index);
    const noSlotsAvailable = allTimeSlotsUnavailable(index);
    const hasDay = !!slots[index].day;

    return (
      <View key={index}>
        <ToggleCard
          title={`Slot ${index + 1}`}
          options={dayOptions}
          disabledOptions={disabledDays}
          initialValue={slots[index].day}
          onChange={(value) => updateSlot(index, "day", value)}
        />
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="small"
              color={theme.colors.system.body.default}
            />
          </View>
        ) : (
          <ToggleCard
            title="Time"
            options={
              noSlotsAvailable && hasDay
                ? ["No slots available"]
                : timeOpts.length > 0
                ? timeOpts
                : ["Select a day first"]
            }
            disabledOptions={noSlotsAvailable ? [] : disabledTimeOpts}
            initialValue={slots[index].time}
            onChange={(value) => {
              if (
                !noSlotsAvailable &&
                value !== "No slots available" &&
                value !== "Select a day first"
              ) {
                updateSlot(index, "time", value);
              }
            }}
          />
        )}
      </View>
    );
  };

  const renderDayCard = (index: number) => {
    const disabledDays = getDisabledDaysForSlot(index);

    return (
      <ToggleCard
        key={`day-${index}`}
        title="Day"
        options={dayOptions}
        disabledOptions={disabledDays}
        initialValue={slots[index].day}
        onChange={(value) => updateSlot(index, "day", value)}
      />
    );
  };

  const renderSubscriptionTimeCard = (index: number) => {
    const isLoading = isLoadingSubscriptionSlots.get(index) || false;
    const timeOpts = getTimeOptionsForSlot(index);
    const disabledTimeOpts = getDisabledTimeOptionsForSlot(index);
    const noSlotsAvailable = allTimeSlotsUnavailable(index);
    const hasDay = !!slots[index].day;

    if (isLoading) {
      return (
        <View style={styles.loadingContainer} key={`time-loading-${index}`}>
          <ActivityIndicator
            size="small"
            color={theme.colors.system.body.default}
          />
        </View>
      );
    }

    if (noSlotsAvailable && hasDay) {
      return (
        <Base key={`time-unavailable-${index}`}>
          <View style={styles.unavailableContainer}>
            <Text
              style={[
                theme.typography.body.md.medium,
                { color: theme.colors.system.body.default },
              ]}
            >
              No slots available for this day
            </Text>
            <Text
              style={[
                theme.typography.body.sm.regular,
                { color: theme.colors.system.body.disabled, marginTop: 4 },
              ]}
            >
              All time slots are fully booked for the next 12 weeks
            </Text>
          </View>
        </Base>
      );
    }

    return (
      <View key={`time-${index}`}>
        <ToggleCard
          title="Time"
          options={
            timeOpts.length > 0 ? timeOpts : ["Select a day first"]
          }
          disabledOptions={disabledTimeOpts}
          initialValue={slots[index].time}
          onChange={(value) => {
            if (value !== "Select a day first") {
              updateSlot(index, "time", value);
            }
          }}
        />
      </View>
    );
  };

  const renderTimeCard = (index: number) => {
    if (isLoadingSlots) {
      return (
        <View style={styles.loadingContainer} key={`time-loading-${index}`}>
          <ActivityIndicator
            size="small"
            color={theme.colors.system.body.default}
          />
        </View>
      );
    }

    const timeOpts = getTimeOptionsForSlot(index);
    const disabledTimeOpts = getDisabledTimeOptionsForSlot(index);

    return (
      <ToggleCard
        key={`time-${index}`}
        title="Time"
        options={timeOpts.length > 0 ? timeOpts : ["No slots available"]}
        disabledOptions={disabledTimeOpts}
        initialValue={slots[index].time}
        onChange={(value) => updateSlot(index, "time", value)}
      />
    );
  };

  return (
    <View style={styles.container}>
      <DatePickerCard
        label={frequency === "Once" ? "Date" : "Start Date"}
        initialDate={startDate}
        onDateChange={(date) => {
          setStartDate(date);
        }}
      />
      {frequency === "Once" && renderTimeCard(0)}

      {frequency === "1x /week" && (
        <>
          {renderDayCard(0)}
          {renderSubscriptionTimeCard(0)}
        </>
      )}

      {frequency === "2x /week" && (
        <>
          {renderSlotCard(0)}
          {renderSlotCard(1)}
        </>
      )}

      {frequency === "3x /week" && (
        <>
          {renderSlotCard(0)}
          {renderSlotCard(1)}
          {renderSlotCard(2)}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  unavailableContainer: {
    alignItems: "center",
    padding: 16,
  },
});

export default ScheduleSelector;
