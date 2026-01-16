import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import Base from "./base";
import Button from "@/components/button";
import ScheduleSelector from "../scheduleSelector";
import { useBooking } from "@/context/booking-context";

type Slot = { day: string; time: string; timeSlotId?: string };

type RescheduleBookingProps = {
  visible: boolean;
  onClose: () => void;
  onCancelPress: () => void;
  onConfirmPress: (date: string, timeSlotId: string) => void;
  serviceName: string; // "Home Cleaning" or "Office Cleaning"
  bedrooms?: number;
  assignedCleanerCount?: number; // For bookings with manual cleaner adjustments
};

const RescheduleBooking: React.FC<RescheduleBookingProps> = ({
  visible,
  onClose,
  onConfirmPress,
  onCancelPress,
  serviceName,
  bedrooms,
  assignedCleanerCount,
}) => {
  const { theme } = useTheme();
  const { setService, setBedrooms, startDate } = useBooking();
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string | null>(null);

  // Set service in context when sheet opens so availability is fetched correctly
  useEffect(() => {
    if (visible) {
      setService(serviceName);
      if (bedrooms !== undefined) {
        setBedrooms(bedrooms);
      }
      setSelectedTimeSlotId(null);
    }
  }, [visible, serviceName, bedrooms, setService, setBedrooms]);

  const handleScheduleChange = (slots: Slot[]) => {
    // For one-time reschedule, we only care about the first slot
    if (slots[0]?.timeSlotId) {
      setSelectedTimeSlotId(slots[0].timeSlotId);
    } else {
      setSelectedTimeSlotId(null);
    }
  };

  const handleConfirm = () => {
    if (startDate && selectedTimeSlotId) {
      onConfirmPress(startDate, selectedTimeSlotId);
    }
  };

  const canConfirm = !!startDate && !!selectedTimeSlotId;

  return (
    <Base
      visible={visible}
      onClose={onClose}
      title="Reschedule Booking"
      backgroundColor={theme.colors.system.background.default}
    >
      <ScheduleSelector
        frequency="Once"
        onChange={handleScheduleChange}
        requiredCleaners={assignedCleanerCount}
      />
      <View style={styles.buttonContainer}>
        <View style={{ opacity: canConfirm ? 1 : 0.5 }}>
          <Button
            label="Confirm"
            variant="filled"
            onPress={canConfirm ? handleConfirm : undefined}
          />
        </View>
        <Button label="Cancel" variant="outline" onPress={onCancelPress} />
      </View>
    </Base>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "column",
    gap: 12,
    marginTop: 16,
  },
});

export default RescheduleBooking;
