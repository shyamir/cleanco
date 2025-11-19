import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "@/theme/useTheme";

type InfoRowProps = {
  icon?: React.ReactNode;
  label?: string;
  value?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
  labelColor?: string;
  valueColor?: string;
};

const InfoRow: React.FC<InfoRowProps> = ({
  icon,
  label,
  value,
  containerStyle,
  labelStyle,
  valueStyle,
  labelColor,
  valueColor,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.row, containerStyle]}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <View style={styles.textWrapper}>
        <Text
          style={[
            {
              ...theme.typography.body.sm.regular,
              color: labelColor || theme.colors.system.body.disabled,
            },
            labelStyle,
          ]}
        >
          {label}
        </Text>
        {value ? (
          <Text
            style={[
              {
                ...theme.typography.body.sm.regular,
                color: valueColor || theme.colors.system.body.default,
              },
              valueStyle,
            ]}
          >
            {value}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: 12,
    // alignItems: "center",
  },
  iconWrapper: {
    marginRight: 12,
  },
  textWrapper: {
    flex: 1,
  },
});

export default InfoRow;
