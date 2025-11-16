// src/components/cleaningSchedule/index.tsx
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import ToggleCard from "@/components/card/toggleCard";
import DatePickerCard from "../card/datePickerCard";
import { useBooking } from "@/context/booking-context";

type Slot = { day: string; time: string };

type ScheduleSelectorProps = {
  frequency: string;
  onChange?: (slots: Slot[]) => void;
};

const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({
  frequency,
  onChange,
}) => {
  const [slots, setSlots] = useState<Slot[]>([
    { day: "", time: "" },
    { day: "", time: "" },
    { day: "", time: "" },
  ]);
const { setSchedule } = useBooking();

  const { startDate, setStartDate } = useBooking();

const updateSlot = (index: number, key: keyof Slot, value: string) => {
  const updated = [...slots];
  updated[index][key] = value;
  setSlots(updated);
  onChange?.(updated);

  // Update context schedule for review
  if (frequency === "Once") {
    const time = updated[0].time;
    const date = startDate;
    if (date && time) {
      setSchedule(`${date}, ${time}`);
    } else if (date) {
      setSchedule(date); // fallback if time not selected yet
    }
  } else {
    // For recurring bookings, build schedule string
    const scheduleStr = updated
      .filter((s) => s.day && s.time)
      .map((s) => `${s.day} ${s.time}`)
      .join(" | ");
    setSchedule(scheduleStr);
  }
};

  const renderSlotCard = (index: number) => (
    <ToggleCard
      key={index}
      title={`Slot ${index + 1}`}
      groups={[
        {
          options: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
          initialValue: slots[index].day,
          onChange: (value) => updateSlot(index, "day", value),
        },
        {
          options: [
            "08:00",
            "09:45",
            "11:30",
            "14:00",
            "15:45",
            "17:30",
            "19:15",
            "",
          ],
          initialValue: slots[index].time,
          onChange: (value) => updateSlot(index, "time", value),
        },
      ]}
    />
  );

  const renderDayCard = (index: number) => (
    <ToggleCard
      key={`day-${index}`}
      title="Day"
      options={[
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ]}
      initialValue={slots[index].day}
      onChange={(value) => updateSlot(index, "day", value)}
    />
  );

  const renderTimeCard = (index: number) => (
    <ToggleCard
      key={`time-${index}`}
      title="Time"
      options={[
        "08:00",
        "09:45",
        "11:30",
        "14:00",
        "15:45",
        "17:30",
        "19:15",
        "",
      ]}
      initialValue={slots[index].time}
      onChange={(value) => updateSlot(index, "time", value)}
    />
  );

  return (
    <View style={styles.container}>
      <DatePickerCard
        label={frequency === "Once" ? "Date" : "Start Date"}
        initialDate={startDate}
        onDateChange={(date) => {
          console.log("Selected start date:", date); // <-- check this
          setStartDate(date);
        }}
      />
      {frequency === "Once" && renderTimeCard(0)}

      {frequency === "1x /week" && (
        <>
          {renderDayCard(0)}
          {renderTimeCard(0)}
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
});

export default ScheduleSelector;
