import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

import Base from "./base";
import Button from "@/components/button";

type CancelBookingProps = {
  visible: boolean;
  onClose: () => void;
  onCancelPress: () => void;
  onReschedulePress: () => void;
};

const CancelBooking: React.FC<CancelBookingProps> = ({
  visible,
  onClose,
  onCancelPress,
  onReschedulePress,
}) => {
  const {theme} = useTheme();

  return (
    <Base
      visible={visible}
      onClose={onClose}
      title="Cancel Booking"
      backgroundColor={theme.colors.system.background.default}
    >
      <Text
        style={[
          theme.typography.body.md.regular,
          { color: theme.colors.system.body.default, marginBottom: 16 },
        ]}
      >
        No refunds will be given for cancellations. Are you sure want to cancel?
      </Text>

      <View style={styles.buttonContainer}>
        <Button
          label="Cancel"
          variant="filled"
          onPress={onCancelPress}
          gradientColors={[
            theme.colors.button.background.error,
            theme.colors.button.background.error,
          ]}
          textStyle={{ color: theme.colors.button.label.default }}
        />
        <Button
          label="Reschedule instead"
          variant="outline"
          onPress={onReschedulePress}
        />
      </View>
    </Base>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "column",
    gap: 12,
    marginTop: 8,
  },
});

export default CancelBooking;
