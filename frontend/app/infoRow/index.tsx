import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "@/theme/useTheme";

type InfoRowProps = {
  icon: React.ReactNode; // pass your icon component
  label: string;
  value: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
};

const InfoRow: React.FC<InfoRowProps> = ({
  icon,
  label,
  value,
  containerStyle,
  labelStyle,
  valueStyle,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.row, containerStyle]}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <View style={styles.textWrapper}>
        <Text
          style={[
            {
              ...theme.typography.body.md.regular,
              color: theme.colors.system.body.disabled,
            },
            labelStyle,
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            {
              ...theme.typography.body.md.regular,
              color: theme.colors.system.body.default,
            },
            valueStyle,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: 12,
  },
  iconWrapper: {
    marginRight: 12,
  },
  textWrapper: {
    flex: 1,
  },
});

export default InfoRow;
