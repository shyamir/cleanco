import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import Base from "./base";
import Button from "@/components/button";
import ScheduleSelector from "../scheduleSelector";

type RescheduleBookingProps = {
  visible: boolean;
  onClose: () => void;
  onCancelPress: () => void;
  onConfirmPress: () => void;
};

const RescheduleBooking: React.FC<RescheduleBookingProps> = ({
  visible,
  onClose,
  onConfirmPress,
  onCancelPress,
}) => {
  const {theme} = useTheme();

  return (
    <Base
      visible={visible}
      onClose={onClose}
      title="Reschedule Booking"
      backgroundColor={theme.colors.system.background.default}
    >
      <ScheduleSelector frequency="Once" />
      <View style={styles.buttonContainer}>
        <Button label="Confirm" variant="filled" onPress={onConfirmPress} />
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
