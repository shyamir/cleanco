import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import Base from "./base";
import ToggleGroup from "@/components/toggleButton/toggleGroup";

type ToggleCardProps = {
  title: string;
  options: string[];
  initialValue?: string;
  onChange?: (value: string) => void;
};

const ToggleCard: React.FC<ToggleCardProps> = ({
  title,
  options,
  initialValue,
  onChange,
}) => {
  const theme = useTheme();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Base>
          <View>
            <Text
              style={[
                {
                  ...theme.typography.heading.xs4.book,
                  color: theme.colors.system.heading.tertiary,
                } as any,
              ]}
            >
              {title}
            </Text>
          </View>
          <ToggleGroup
            options={options}
            initialValue={initialValue}
            onChange={onChange}
          />
        </Base>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    // backgroundColor: "#ff0000",
    // flex: 1,
  },
});

export default ToggleCard;
