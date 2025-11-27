import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import Base from "./base";
import Button from "@/components/button";

type SignOutProps = {
  visible: boolean;
  onClose: () => void;
  onSignOutPress: () => void;
  onCancelPress: () => void;
};

const SignOut: React.FC<SignOutProps> = ({
  visible,
  onClose,
  onSignOutPress,
  onCancelPress,
}) => {
  const {theme} = useTheme();

  return (
    <Base
      visible={visible}
      onClose={onClose}
      title="Are you sure?"
      backgroundColor={theme.colors.system.background.default}
    >


      <View style={styles.buttonContainer}>
        <Button
          label="Sign out"
          variant="filled"
          onPress={onSignOutPress}
          gradientColors={[
            theme.colors.button.background.error,
            theme.colors.button.background.error,
          ]}
          textStyle={{ color: theme.colors.button.label.default }}
        />

        <Button label="Cancel" variant="outline" onPress={onCancelPress} />
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

export default SignOut;
